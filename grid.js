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
$cellCreated.subscribe((cell) => console.log('cellCreated', cell))
$cellRestored.subscribe((cell) => console.log('cellRestored', cell))
$cellMoved.subscribe((cell) => console.log('cellMoved', cell))
$cellUpdated.subscribe((cell) => console.log('cellUpdated', cell))
$cellRemoved.subscribe((cell) => console.log('cellRemoved', cell))

//

const $cellMap = signal(new Map())

export const $selection = signal({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } })
export const $selectionRange = computed([$selection], (selection) => {
  const { start, end } = selection
  return Range.fromPoints(start, end)
})

export const $contentRange = signal({ x: 0, y: 0, width: 0, height: 0 })
function updateContentRange(cellMap) {
  const positions = Array.from(cellMap.values()).map(({ position }) => position)
  $contentRange.set(Range.getBoundingRange(positions))
}
$cellMap.subscribe(debounce(updateContentRange, 0))

export function getGrid() {
  return {
    cellMap: $cellMap(),
    selection: $selection(),
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

  $selection.set(selection)
}

function newCell(position, value) {
  return { position, value, id: {} }
}

// Selection

export function select(start, end = start) {
  $selection.set({ start, end })
}
export function selectTo(end) {
  $selection.update(({ start }) => {
    return { start, end }
  })
}

export function clearSelection() {
  $selection.update(({ end }) => {
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
  const cells = getCells().filter((cell) =>
    Range.contains(range, cell.position),
  )
  return positionedValuesToText(cells)
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

  updatedCells.forEach((cell) => $cellUpdated.emit(cell))
  createdCells.forEach((cell) => $cellCreated.emit(cell))
  removedCells.forEach((cell) => $cellRemoved.emit(cell))
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

  removedCells.forEach($cellRemoved.emit)
  return removedCells.length
}

export function displaceRangeBy(range, offset) {
  const displacement = (() => {
    if (offset.x === -1) {
      return {
        range: {
          ...range,
          x: range.x - 1,
          width: 0,
        },
        offset: {
          x: range.width + 1,
          y: 0,
        },
      }
    }
    if (offset.x === 1) {
      return {
        range: {
          ...range,
          x: range.x + range.width + 1,
          width: 0,
        },
        offset: {
          x: -range.width - 1,
          y: 0,
        },
      }
    }
    if (offset.y === -1) {
      return {
        range: {
          ...range,
          y: range.y - 1,
          height: 0,
        },
        offset: {
          x: 0,
          y: range.height + 1,
        },
      }
    }
    if (offset.y === 1) {
      return {
        range: {
          ...range,
          y: range.y + range.height + 1,
          height: 0,
        },
        offset: {
          x: 0,
          y: -range.height - 1,
        },
      }
    }
    throw 'error'
  })()

  function getNewPosition(point) {
    if (Range.contains(range, point)) {
      return Point.add(point, offset)
    }
    if (Range.contains(displacement.range, point)) {
      return Point.add(point, displacement.offset)
    }
    return null
  }

  setCells(
    getCells().map((cell) => {
      const newPosition = getNewPosition(cell.position)
      if (!newPosition) return cell

      const movedCell = { ...cell, position: newPosition }
      $cellMoved.emit(movedCell, cell)
      return movedCell
    }),
  )
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
    removedCells.forEach($cellRemoved.emit)
    cells = remainingCells
  }

  cells = cells.map((cell) => {
    if (!Range.contains(range, cell.position)) return cell
    const movedCell = { ...cell, position: Point.add(cell.position, offset) }
    $cellMoved.emit(movedCell, cell)
    return movedCell
  })

  setCells(cells)
}

//

export function insertText(start, text) {
  console.log('INSERT TEXT', start.x, start.y, text)

  const positionedValues = textToPositionedValues(text).map(
    ({ position, value }) => ({
      position: Point.add(position, start),
      value,
    }),
  )

  if (!positionedValues.length) return
  const bounds = Range.getBoundingRange(
    positionedValues.map(({ position }) => position),
  )
  writeRange(bounds, positionedValues)
  return bounds
}

// Convert text to {position, value}
function textToPositionedValues(text) {
  const lines = text.split('\n')
  const positionedValues = []
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y]
    for (let x = 0; x < line.length; x++) {
      const c = line[x]
      if (c.match(/\s/)) continue
      positionedValues.push({ position: { x, y }, value: c })
    }
  }
  return positionedValues
}

// Full-width space character
const defaultTextValue = '\u3000'
// TODO: sloooow
function positionedValuesToText(positionedValues) {
  const bounds = Range.getBoundingRange(
    positionedValues.map(({ position }) => position),
  )
  const lines = []
  for (let y = bounds.y; y < bounds.y + bounds.height + 1; y++) {
    const line = []
    for (let x = bounds.x; x < bounds.x + bounds.width + 1; x++) {
      const cell = positionedValues.find(
        ({ position: { x: px, y: py } }) => x === px && y === py,
      )
      console.log(`Checking position (${x}, ${y}):`, cell)
      line.push(cell ? cell.value : defaultTextValue)
    }
    lines.push(line.join(''))
  }
  return lines.join('\n')
}
