import * as Point from './point.js'
import * as Range from './range.js'
import { debounce, partition } from './util.js'

import { computed, signal } from './signal.js'

export const $cellCreated = signal()
export const $cellRestored = signal()
export const $cellMoved = signal()
export const $cellUpdated = signal()
export const $cellRemoved = signal()

// Subscribe to each signal for logging
// $cellCreated.subscribe((cell) => console.log('cellCreated', cell))
// $cellRestored.subscribe((cell) => console.log('cellRestored', cell))
// $cellMoved.subscribe((cell) => console.log('cellMoved', cell))
// $cellUpdated.subscribe((cell) => console.log('cellUpdated', cell))
// $cellRemoved.subscribe((cell) => console.log('cellRemoved', cell))

//

const $cellMap = signal(new Map())
// $cellMap.subscribe((cellMap) => (window.cells = getCells()))

export const $rawSelection = signal({
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
})

// Can't cut a multi-cell item in half
export const $selection = computed([$rawSelection], ({ start, end }) => {
  const range = getExtendedRange(Range.fromPoints(start, end))
  const cursorRange = getExtendedRange({
    ...end,
    width: 0,
    height: 0,
  })
  return { range, cursorRange }
})

//

export const $contentRange = signal({ x: 0, y: 0, width: 0, height: 0 })
function updateContentRange(cellMap) {
  const positions = Array.from(cellMap.values()).map(({ position }) => position)
  $contentRange.set(Range.getBoundingRange(positions))
}
$cellMap.subscribe(debounce(updateContentRange, 0))

export function getGrid() {
  return {
    cellMap: $cellMap(),
    selection: $rawSelection(),
  }
}
export function setGrid({ selection, cellMap }) {
  const oldCells = getCells()
  const oldCellsById = new Map(oldCells.map((cell) => [cell.id, cell]))

  $cellMap.set(cellMap)

  const newCells = getCells()
  for (const cell of newCells) {
    $cellRestored.emit(cell)
    oldCellsById.delete(cell.id)
  }

  for (const cell of oldCellsById.values()) {
    $cellRemoved.emit(cell)
  }

  $rawSelection.set(selection)
}

function newCell(position, value) {
  return { position, value, id: {} }
}

// Selection

export function select(start, end = start) {
  $rawSelection.set({ start, end })
}
export function selectTo(end) {
  $rawSelection.update(({ start }) => {
    return { start, end }
  })
}

export function clearSelection() {
  $rawSelection.update(({ end }) => {
    return { start: end, end }
  })
}

//

export function getCellAt({ x, y }) {
  return $cellMap().get(`${x},${y}`)
}

export function getCells() {
  return Array.from($cellMap().values())
}

function setCells(cells) {
  $cellMap.set(
    new Map(
      cells.map((cell) => [`${cell.position.x},${cell.position.y}`, cell]),
    ),
  )
}

export function readRange(range) {
  const cells = getCells().filter((cell) => rangeContainsCell(range, cell))
  // Todo: this is the only call to cellsToText
  // which needs a. cells, b. lookup map, c. bounding range
  // all 3 of which we have, sort of through [cells, $cellMap(), range]
  return cellsToText(cells)
}

//

export function writeRange(range, pseudoCells) {
  const pseudoCellMap = new Map(
    pseudoCells.map((cell) => {
      const { x, y } = cell.position
      return [`${x},${y}`, cell]
    }),
  )

  // If there exist cells in target range:
  // either update them to a value defined in newCells
  // or remove them
  const untouchedCells = []
  const updatedCells = []
  const removedCells = []

  for (const cell of getCells()) {
    if (!rangeContainsCell(range, cell)) {
      untouchedCells.push(cell)
      continue
    }

    const { x, y } = cell.position
    const key = `${x},${y}`
    const pseudoCell = pseudoCellMap.get(key)
    if (pseudoCell) {
      pseudoCellMap.delete(key) // Remove processed cell from map
      const updatedCell = { ...cell, value: pseudoCell.value }
      updatedCells.push(updatedCell)
      continue
    }

    removedCells.push(cell)
    continue
  }

  // Remaining new cells are the ones that were not matched with existing cells
  const createdCells = Array.from(pseudoCellMap.values()).map(
    ({ position, value }) => newCell(position, value),
  )

  setCells([...untouchedCells, ...updatedCells, ...createdCells])

  updatedCells.forEach((cell) => $cellUpdated.emit(cell))
  createdCells.forEach((cell) => $cellCreated.emit(cell))
  removedCells.forEach((cell) => $cellRemoved.emit(cell))
}

export function removeRange(range) {
  const removedCells = []

  setCells(
    getCells().filter((cell) => {
      if (!rangeContainsCell(range, cell)) return true
      removedCells.push(cell)
      return false
    }),
  )

  removedCells.forEach($cellRemoved.emit)
  return removedCells.length
}

export function displaceRangeBy(range, offset) {
  const otherRange = getExtendedRange({
    ...Range.getAdjacentPosition(range, offset),
    width: offset.x ? 0 : range.width,
    height: offset.y ? 0 : range.height,
  })

  // there be bugs
  const extendedRange = getExtendedRange(
    Range.getBoundingRange([range, otherRange]),
  )

  const rangeOffset = Point.scale(
    {
      x: otherRange.width + 1,
      y: otherRange.height + 1,
    },
    offset,
  )
  const otherRangeOffset = Point.scale(
    {
      x: range.width + 1,
      y: range.height + 1,
    },
    Point.scale(offset, -1),
  )

  function getNewPosition(cell) {
    if (rangeContainsCell(otherRange, cell)) {
      return Point.add(cell.position, otherRangeOffset)
    }

    if (rangeContainsCell(extendedRange, cell)) {
      return Point.add(cell.position, rangeOffset)
    }

    return null
  }

  setCells(
    getCells().map((cell) => {
      const newPosition = getNewPosition(cell)
      if (!newPosition) return cell

      const movedCell = { ...cell, position: newPosition }
      $cellMoved.emit(movedCell, cell)
      return movedCell
    }),
  )

  return rangeOffset
}

export function moveRangeBy(range, offset, removeOverlap = true) {
  let cells = getCells()

  if (removeOverlap) {
    const targetRange = Range.moveBy(range, offset)

    const [removedCells, remainingCells] = partition(
      cells,
      (cell) =>
        rangeContainsCell(targetRange, cell, false) &&
        !rangeContainsCell(range, cell),
    )
    removedCells.forEach($cellRemoved.emit)
    cells = remainingCells
  }

  cells = cells.map((cell) => {
    if (!rangeContainsCell(range, cell)) return cell
    const movedCell = { ...cell, position: Point.add(cell.position, offset) }
    $cellMoved.emit(movedCell, cell)
    return movedCell
  })

  setCells(cells)
}

function getInlineLength(position) {
  let x = position.x
  for (let emptyCount = 0; emptyCount < 3; ) {
    const cell = getCellAt({ x, y: position.y })
    if (cell) {
      emptyCount = 0
      x += cell.value.width
    } else {
      emptyCount++
      x++
    }
  }
  return x - 1
}

export const $paragraphRange = computed(
  [$selection],
  ({ range: selectionRange }) => {
    const right = getInlineLength({
      x: selectionRange.x + selectionRange.width,
      y: selectionRange.y,
    })
    return {
      ...selectionRange,
      width: right - selectionRange.x,
    }
  },
)

export function push(position, direction) {
  const endX = getInlineLength(position)
  console.log('push from', position.x, endX)
  setCells(
    getCells().map((cell) => {
      if (cell.position.y !== position.y) return cell
      if (cell.position.x < position.x || cell.position.x > endX) return cell

      const newPosition = Point.add(cell.position, { x: 1, y: 0 })

      const movedCell = { ...cell, position: newPosition }
      $cellMoved.emit(movedCell, cell)
      return movedCell
    }),
  )
}

//

export function overwriteText(start, text) {
  console.log('INSERT TEXT', start.x, start.y, text)

  const pseudoCells = textToCells(text).map(({ position, value }) => ({
    position: Point.add(position, start),
    value,
  }))

  if (!pseudoCells.length) return
  const bounds = Range.getBoundingRange(
    pseudoCells.map(({ position }) => position),
  )
  writeRange(bounds, pseudoCells)
  return bounds
}

import { isFullWidth } from './fullwidth.js'
const isWhitespace = (c) => c.match(/\s/)

//

export function rangeContainsCell(range, cell, fully = true) {
  if (cell.value.width === 2) {
    if (fully)
      return (
        Range.contains(range, cell.position) &&
        Range.contains(range, Point.add(cell.position, { x: 1, y: 0 }))
      )
    else
      return (
        Range.contains(range, cell.position) ||
        Range.contains(range, Point.add(cell.position, { x: 1, y: 0 }))
      )
  }
  return Range.contains(range, cell.position)
}

// Convert text to {position, value}
function textToCells(text) {
  const lines = text.split('\n')
  const positionedValues = []
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y]
    const characters = [...line]

    let x = 0
    for (let i = 0; i < characters.length; i++) {
      const text = characters[i]
      const position = { x, y }
      const width = isFullWidth(text) ? 2 : 1

      if (!isWhitespace(text)) {
        positionedValues.push({ position, value: { text, width } })
      }

      x += width
    }
  }
  return positionedValues 
}

// Full-width space character: '\u3000'
const defaultTextValue = ' '
function cellsToText(cells, lookupMap) {
  lookupMap ??= new Map(
    cells.map((o) => [`${o.position.x},${o.position.y}`, o]),
  )
  const bounds = Range.getBoundingRange(cells.map(({ position }) => position))
  const lines = []
  for (let y = bounds.y; y < bounds.y + bounds.height + 1; y++) {
    const line = []
    for (let x = bounds.x; x < bounds.x + bounds.width + 1; ) {
      const cell = lookupMap.get(`${x},${y}`)
      if (cell) {
        line.push(cell.value.text)
        x += cell.value.width
      } else {
        line.push(defaultTextValue)
        x++
      }
    }
    lines.push(line.join('').trimEnd())
  }
  return lines.join('\n')
}

//

const normalizeCharacter = (character) => character.toLowerCase()
const isSpace = (character) => character === ' '

export function search(text) {
  const characters = [...text.trim().replace(/\s+/g, ' ')].map(
    normalizeCharacter,
  )
  if (characters.length === 0) return []
  const firstCharacter = characters[0]
  const startCells = getCells().filter(
    (cell) => normalizeCharacter(cell.value.text) === firstCharacter,
  )

  // In-place sorting
  startCells.sort((a, b) => {
    if (a.position.y === b.position.y) {
      return a.position.x - b.position.x
    }
    return a.position.y - b.position.y
  })

  if (characters.length === 1) {
    return startCells.map(({ position }) => ({
      ...position,
      width: 0,
      height: 0,
    }))
  }

  return startCells.flatMap(({ position }) => {
    return [
      { x: 1, y: 0 }, // Horizontal
      { x: 0, y: 1 }, // Vertical
    ].flatMap((direction) => {
      const match = characters.slice(1).every((character, i) => {
        const cell = getCellAt(
          Point.add(position, Point.scale(direction, i + 1)),
        )
        // Space character? Expect NO cell
        if (isSpace(character)) return !cell
        // Not space: expect a cell
        if (!cell) return false
        // Check cell value
        return normalizeCharacter(cell.value.text) === character
      })

      // No match? Skip
      if (!match) return []

      const { x: width, y: height } = Point.scale(
        direction,
        characters.length - 1,
      )
      return [{ ...position, width, height }]
    })
  })
}

//

// Ensure that items larger than 1x1
// are fully contained in the range
function getExtendedRange(range) {
  let minLeft = range.x
  let minRight = range.x + range.width

  const cells = getCells()
  let didExpand = false
  do {
    didExpand = false
    for (const cell of cells) {
      const { x, y } = cell.position
      if (y < range.y || y > range.y + range.height) continue
      const { width } = cell.value
      if (width === 1) continue

      const cellLeft = x
      const cellRight = x + 1

      if (cellLeft === minLeft - 1) {
        minLeft = cellLeft
        didExpand = true
      }

      if (cellRight === minRight + 1) {
        minRight = cellRight
        didExpand = true
      }
    }
  } while (didExpand)

  return {
    x: minLeft,
    y: range.y,
    width: minRight - minLeft,
    height: range.height,
  }
}

function squareGrided(range) {
  return {
    ...range,
    x: Math.floor(range.x / 2) * 2,
    width: Math.ceil((range.width + 1) / 2) * 2 - 1,
  }
}
