import * as Cells from './cells.js'
import * as Range from './range.js'
import * as Point from './point.js'
import { mapChanges } from './util.js'

export function init() {
  return {
    /** @type {{x: number; y: number}|null} */
    cursor: null,
    /** @type {{x: number; y: number}|null} */
    selectionStart: null,
    cells: [],
  }
}

export const CURSOR = 'cursor'
export const SELECTION_RANGE = 'selection'

// Cursor stuff

export function getSelectionRange(grid) {
  if (!grid.cursor || !grid.selectionStart) return null
  return Range.fromPoints(grid.cursor, grid.selectionStart)
}

export function setCursor(grid, point) {
  return [
    {
      ...grid,
      cursor: point,
    },
    [
      [CURSOR, point],
      [SELECTION_RANGE, getSelectionRange(grid)],
    ],
  ]
}

export function setSelectionStart(grid, point) {
  return [
    {
      ...grid,
      selectionStart: point,
    },
    [[SELECTION_RANGE, getSelectionRange(grid)]],
  ]
}

export function setCursorAndSelectionStart(
  grid,
  cursor,
  selectionStart = cursor,
) {
  return [
    {
      ...grid,
      cursor,
      selectionStart,
    },
    [
      [CURSOR, cursor],
      [SELECTION_RANGE, getSelectionRange(grid)],
    ],
  ]
}

export function clearSelection(grid) {
  return setSelectionStart(grid, grid.cursor)
}

//

export function removeRange(grid, range) {
  return mapChanges(Cells.removeRange(grid.cells, range), (cells) => ({
    ...grid,
    cells,
  }))
}

export function nudgeRangeBy(grid, range, offset) {
  return mapChanges(
    Cells.nudgeRangeBy(grid.cells, range, offset),
    (cells) => ({ ...grid, cells }),
    (grid) =>
      setCursorAndSelectionStart(
        grid,
        Point.add(grid.cursor, offset),
        Point.add(grid.selectionStart, offset),
      ),
  )
}

export function moveRangeBy(grid, range, offset, removeDestination = true) {
  return mapChanges(
    Cells.moveRangeBy(grid.cells, range, offset, removeDestination),
    (cells) => ({ ...grid, cells }),
    (grid) =>
      setCursorAndSelectionStart(
        grid,
        Point.add(grid.cursor, offset),
        Point.add(grid.selectionStart, offset),
      ),
  )
}
