import { filterMap, partition } from './util.js'
import * as Range from './range.js'
import * as Point from './point.js'
import {
  cellMoved,
  cellRemoved,
  cursorChanged,
  selectionChanged,
} from './controller.js'

export let grid = {
  cursor: null,
  selectionStart: null,
  cells: [],
}

export function setGrid(newGrid) {
  grid = newGrid
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

export function readRange(range) {
  return 'foo'
}

//

export function removeRange(range) {
  const [removedCells, cells] = partition(grid.cells, (cell) =>
    Range.contains(range, cell.position),
  )
  removedCells.forEach(cellRemoved)
  grid = { ...grid, cells }
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

  const cells = grid.cells.map((cell) => {
    const newPosition = getNewPosition(cell.position)
    if (!newPosition) return cell

    const movedCell = { ...cell, position: newPosition }
    cellMoved(movedCell)
    return movedCell
  })
  grid = { ...grid, cells }

  moveSelectionBy(offset)
}

export function moveRangeBy(range, offset, removeOverlap = true) {
  if (removeOverlap) {
    const targetRange = Range.move(range, offset)
    const [removedCells, cells] = partition(
      grid.cells,
      (cell) =>
        Range.contains(targetRange, cell.position) &&
        !Range.contains(range, cell.position),
    )
    removedCells.forEach(cellRemoved)
    grid = { ...grid, cells }
  }

  const cells = grid.cells.map((cell) => {
    if (!Range.contains(range, cell.position)) return cell
    const movedCell = { ...cell, position: Point.add(cell.position, offset) }
    cellMoved(movedCell)
    return movedCell
  })
  grid = { ...grid, cells }

  moveSelectionBy(offset)
}
