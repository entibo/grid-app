import { emitter } from './emitter.js'
import * as Point from './point.js'
import * as Range from './range.js'
import { debounce, partition } from './util.js'

import { signal, computed } from '@preact/signals-core'

export const onCellCreated = emitter()
export const onCellRestored = emitter()
export const onCellMoved = emitter()
export const onCellUpdated = emitter()
export const onCellRemoved = emitter()

// Subscribe to each signal for logging
// $cellCreated.subscribe((cell) => console.log('cellCreated', cell))
// $cellRestored.subscribe((cell) => console.log('cellRestored', cell))
// $cellMoved.subscribe((cell) => console.log('cellMoved', cell))
// $cellUpdated.subscribe((cell) => console.log('cellUpdated', cell))
// $cellRemoved.subscribe((cell) => console.log('cellRemoved', cell))

//

const $cellMap = signal(new Map())
// $cellMap.subscribe((cellMap) => (window.cells = getCells()))

// Selection

export const $selection = signal({
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
})

export function select(start, end = start) {
  $selection.value = { start, end }
}
export function selectTo(end) {
  const { start } = $selection.value
  $selection.value = { start, end }
}
export function clearSelection() {
  const { end } = $selection.value
  select(end, end)
}

export const $selectionRange = computed(() => {
  const { start, end } = $selection.value
  return Range.fromPoints(start, end)
})

//

export const $contentRange = signal({ x: 0, y: 0, width: 0, height: 0 })
function updateContentRange(cellMap) {
  const positions = Array.from(cellMap.values()).map(({ position }) => position)
  $contentRange.value = Range.getBoundingRange(positions)
}
$cellMap.subscribe(debounce(updateContentRange, 0))

export function getGrid() {
  return {
    cellMap: $cellMap.value,
    selection: $selection.value,
  }
}
export function setGrid({ selection, cellMap }) {
  const oldCellsById = new Map(getCells().map((cell) => [cell.id, cell]))

  $cellMap.value = cellMap

  const newCells = getCells()
  for (const cell of newCells) {
    onCellRestored.emit(cell)
    oldCellsById.delete(cell.id)
  }

  for (const cell of oldCellsById.values()) {
    onCellRemoved.emit(cell)
  }

  $selection.value = selection
}

function newCell(position, value) {
  return { position, value, id: {} }
}

//

export function getCellAt({ x, y }) {
  return $cellMap.value.get(`${x},${y}`)
}

export function getCells() {
  return Array.from($cellMap.value.values())
}

function setCells(cells) {
  $cellMap.value = new Map(
    cells.map((cell) => [`${cell.position.x},${cell.position.y}`, cell]),
  )
}

export function readRange(range) {
  if (!range) return cellsToText(getCells())
  const cells = getCells().filter((cell) =>
    Range.contains(range, cell.position),
  )
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
    if (!Range.contains(range, cell.position)) {
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

  updatedCells.forEach((cell) => onCellUpdated.emit(cell))
  createdCells.forEach((cell) => onCellCreated.emit(cell))
  removedCells.forEach((cell) => onCellRemoved.emit(cell))
}

export function removeRange(range) {
  const removedCells = []

  setCells(
    getCells().filter((cell) => {
      if (!Range.contains(range, cell.position)) return true
      removedCells.push(cell)
      return false
    }),
  )

  removedCells.forEach(onCellRemoved.emit)
  return removedCells.length
}

export function displaceRangeBy(range, offset) {
  const otherRange = {
    ...Range.getAdjacentPosition(range, offset),
    width: offset.x ? 0 : range.width,
    height: offset.y ? 0 : range.height,
  }

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
    if (Range.contains(otherRange, cell.position)) {
      return Point.add(cell.position, otherRangeOffset)
    }

    if (Range.contains(range, cell.position)) {
      return Point.add(cell.position, rangeOffset)
    }

    return null
  }

  setCells(
    getCells().map((cell) => {
      const newPosition = getNewPosition(cell)
      if (!newPosition) return cell

      const movedCell = { ...cell, position: newPosition }
      onCellMoved.emit(movedCell, cell)
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
        Range.contains(targetRange, cell.position) &&
        !Range.contains(range, cell.position),
    )
    removedCells.forEach(onCellRemoved.emit)
    cells = remainingCells
  }

  cells = cells.map((cell) => {
    if (!Range.contains(range, cell.position)) return cell
    const movedCell = { ...cell, position: Point.add(cell.position, offset) }
    onCellMoved.emit(movedCell, cell)
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
      x += 1
    } else {
      emptyCount++
      x++
    }
  }
  return x - 1
}

export const $paragraphRange = computed(() => {
  const selectionRange = $selectionRange.value
  const right = getInlineLength({
    x: selectionRange.x + selectionRange.width,
    y: selectionRange.y,
  })
  return {
    ...selectionRange,
    width: right - selectionRange.x,
  }
})

export function push(position, direction) {
  const endX = getInlineLength(position)
  console.log('push from', position.x, endX)
  setCells(
    getCells().map((cell) => {
      if (cell.position.y !== position.y) return cell
      if (cell.position.x < position.x || cell.position.x > endX) return cell

      const newPosition = Point.add(cell.position, { x: 1, y: 0 })

      const movedCell = { ...cell, position: newPosition }
      onCellMoved.emit(movedCell, cell)
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

//

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

      if (!text.match(/\s/)) {
        positionedValues.push({ position, value: text })
      }

      x++
    }
  }
  return positionedValues
}

// Full-width space character: '\u3000'
const defaultTextValue = '\u3000'
function cellsToText(cells, lookupMap) {
  lookupMap ??= new Map(
    cells.map((o) => [`${o.position.x},${o.position.y}`, o]),
  )
  const bounds = Range.getBoundingRange(cells.map(({ position }) => position))
  const lines = []
  for (let y = bounds.y; y < bounds.y + bounds.height + 1; y++) {
    const line = []
    for (let x = bounds.x; x < bounds.x + bounds.width + 1; x++) {
      const cell = lookupMap.get(`${x},${y}`)
      line.push(cell?.value ?? defaultTextValue)
    }
    lines.push(line.join('').trimEnd())
  }
  return lines.join('\n')
}

//

const normalizeCharacter = (character) => character.toLowerCase()

export function search(text) {
  const characters = [...text.trim().replace(/\s+/g, ' ')].map(
    normalizeCharacter,
  )
  if (characters.length === 0) return []
  const firstCharacter = characters[0]
  const startCells = getCells().filter(
    (cell) => normalizeCharacter(cell.value) === firstCharacter,
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
        // Normalized space character? Expect NO cell
        if (character === ' ') return !cell
        // Not space: expect a cell
        if (!cell) return false
        // Check cell value
        return normalizeCharacter(cell.value) === character
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
