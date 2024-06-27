import * as Grid from './grid.js'
import * as History from './history.js'
import * as Keyboard from './keyboard.js'
import * as Point from './point.js'
import { mapChanges } from './util.js'

let grid = Grid.init()
const history = History.init()
const view = View.init()

function restoreGrid(newGrid) {
  grid = newGrid
  cursorChanged(grid.cursor)
  selectionChanged(Grid.getSelectionRange(grid))
  for (const cell of grid.cells) {
    restoreCell(cell)
  }
}
function restoreCell(cell) {}

function checkpoint() {
  History.save(history, grid)
}

export function undo() {
  if (!History.canUndo(history)) return
  const grid = History.undo(history)
  restoreGrid(grid)
}

export function redo() {
  if (!History.canRedo(history)) return
  const grid = History.redo(history)
  restoreGrid(grid)
}

export function cursorChanged(cursor) {
  View.setCursor(view, cursor)
}

export function copy() {}
export function cut() {
  checkpoint()
  const range = Grid.getSelectionRange(grid)
  Grid.removeRange(grid, range)
}

export function selectColumn() {
  const range = Grid.getSelectionRange(grid)
  if (!range) return
  grid = Grid.setCursorAndSelectionStart(
    grid,
    {
      x: grid.cursor.x,
      y: 0,
    },
    {
      x: grid.selectionStart.x,
      y: 99999,
    },
  )
}

export function selectRow() {
  const range = Grid.getSelectionRange(grid)
  if (!range) return
  grid = Grid.setCursorAndSelectionStart(
    grid,
    {
      x: 0,
      y: grid.cursor.y,
    },
    {
      x: 99999,
      y: grid.selectionStart.y,
    },
  )
}

export function selectAll() {
  selectColumn()
  selectRow()
}

export function clearSelection() {
  grid = Grid.clearSelection(grid)
}

Keyboard.init(view.textarea)

export function compositionStateChange(compositionState, compositionText) {
  if (compositionState === 'end') {
    hideInputRange()
  } else if (compositionState === 'start') {
    showInputRange()
  }
  updateInputRange(compositionText)
}

export function insertText(text, type) {
  // Grid.insertText(grid, text, type)
}

Keyboard({
  move(offset, mode) {
    if (mode === 'select') {
      handleChanges(Grid.setCursor(grid, Point.move(grid.cursor, offset)))

      return mapChanges(
        Grid.setCursor(grid, Point.move(grid.cursor, offset)),
        (grid) => ({ ...grid, cursor: Point.move(grid.cursor, offset) }),
      )
    }

    if (mode === 'normal') {
      handleChanges(
        Grid.setCursor(grid, { x: grid.cursor.x + dx, y: grid.cursor.y + dy }),
      )
    }

    if (mode === 'displace') {
      History.save(history, Grid.save(grid))
      handleChanges(
        Grid.nudgeRangeBy(grid, Grid.getSelectionRange(grid), {
          dx,
          dy,
        }),
      )
    }
  },
})
