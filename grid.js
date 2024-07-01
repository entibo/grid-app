import { filterMap, partition } from './util.js'
import * as Range from './range.js'
import * as Point from './point.js'
import {
  cellCreated,
  cellMoved,
  cellRemoved,
  cellUpdated,
  cursorChanged,
  selectionChanged,
} from './index.js'

export let grid = {
  cursor: null,
  selectionStart: null,
  cellMap: new Map(),
}

export function setGrid(newGrid) {
  grid = newGrid
}

function setCells(cells) {
  const cellMap = new Map(
    cells.map((cell) => [`${cell.position.x},${cell.position.y}`, cell]),
  )
  grid = {
    ...grid,
    cellMap,
  }
}

let nextId = 0
function newCell(position, value) {
  const id = (nextId++).toString()
  return { position, value, id }
}

// Cursor stuff

export function getSelectionRange() {
  if (!grid.cursor || !grid.selectionStart) return null
  return Range.fromPoints(grid.cursor, grid.selectionStart)
}

export function setCursor(cursor) {
  if (Point.equals(cursor, grid.cursor)) return
  grid = { ...grid, cursor }
  cursorChanged(cursor)
  selectionChanged(getSelectionRange(grid))
}

export function setSelectionStart(selectionStart) {
  if (Point.equals(selectionStart, grid.selectionStart)) return
  grid = { ...grid, selectionStart }
  selectionChanged(getSelectionRange(grid))
}

export function setCursorAndSelectionStart(cursor, selectionStart = cursor) {
  if (
    Point.equals(cursor, grid.cursor) &&
    Point.equals(selectionStart, grid.selectionStart)
  )
    return
  grid = { ...grid, cursor, selectionStart }
  cursorChanged(cursor)
  selectionChanged(getSelectionRange(grid))
}

export function moveSelectionBy(offset) {
  setCursorAndSelectionStart(
    Point.add(grid.cursor, offset),
    Point.add(grid.selectionStart, offset),
  )
}

export function clearSelection() {
  setSelectionStart(grid.cursor)
}

//

export function getCellAt({ x, y }) {
  return grid.cellMap.get(`${x},${y}`)
}

export function getCells() {
  return Array.from(grid.cellMap.values())
}

export function readRange(range) {
  const cells = getCells().filter((cell) =>
    Range.contains(range, cell.position),
  )
  // return ... positionedValuesToText
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

  updatedCells.forEach((cell) => cellUpdated(cell))
  createdCells.forEach((cell) => cellCreated(cell))
  removedCells.forEach((cell) => cellRemoved(cell))
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

  removedCells.forEach(cellRemoved)
}

export function displaceRangeBy(range, offset) {
  const displacement = (() => {
    if (offset.dx === -1) {
      return {
        range: {
          ...range,
          x: range.x - 1,
          dx: 0,
        },
        offset: {
          dx: range.dx + 1,
          dy: 0,
        },
      }
    }
    if (offset.dx === 1) {
      return {
        range: {
          ...range,
          x: range.x + range.dx + 1,
          dx: 0,
        },
        offset: {
          dx: -range.dx - 1,
          dy: 0,
        },
      }
    }
    if (offset.dy === -1) {
      return {
        range: {
          ...range,
          y: range.y - 1,
          dy: 0,
        },
        offset: {
          dx: 0,
          dy: range.dy + 1,
        },
      }
    }
    if (offset.dy === 1) {
      return {
        range: {
          ...range,
          y: range.y + range.dy + 1,
          dy: 0,
        },
        offset: {
          dx: 0,
          dy: -range.dy - 1,
        },
      }
    }
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
      cellMoved(movedCell, cell)
      return movedCell
    }),
  )

  moveSelectionBy(offset)
}

export function moveRangeBy(range, offset, removeOverlap = true) {
  let cells = getCells()

  if (removeOverlap) {
    const targetRange = Range.move(range, offset)
    const [removedCells, remainingCells] = partition(
      cells,
      (cell) =>
        Range.contains(targetRange, cell.position) &&
        !Range.contains(range, cell.position),
    )
    removedCells.forEach(cellRemoved)
    cells = remainingCells
  }

  cells = cells.map((cell) => {
    if (!Range.contains(range, cell.position)) return cell
    const movedCell = { ...cell, position: Point.add(cell.position, offset) }
    cellMoved(movedCell)
    return movedCell
  })

  setCells(cells)

  moveSelectionBy(offset)
}

//

export function insertText(text) {
  const positionedValues = textToPositionedValues(text).map(
    ({ position, value }) => ({
      position: Point.add(position, grid.cursor),
      value,
    }),
  )
  const bounds = Range.getBoundingRange(
    positionedValues.map(({ position }) => position),
  )
  writeRange(bounds, positionedValues)
}

//

// Convert text to {position, value}
function textToPositionedValues(text) {
  const lines = text.split('\n')
  const positionedValues = []
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y]
    for (let x = 0; x < line.length; x++) {
      positionedValues.push({ position: { x, y }, value: line[x] })
    }
  }
  return positionedValues
}

const defaultTextValue = '\u3000'
/**
 * Input: [{ position: {32,6}, value: "a" }, { position: {33,6}, value: "b" }]
 * Output: "ab"
 */
function positionedValuesToText(positionedValues) {
  const bounds = Range.getBoundingRange(
    positionedValues.map(({ position }) => position),
  )
  const lines = []
  for (let y = bounds.y; y < bounds.y + bounds.dy + 1; y++) {
    const line = []
    for (let x = bounds.x; x < bounds.x + bounds.dx + 1; x++) {
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
