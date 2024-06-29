import * as Grid from './grid.js'
import { grid } from './grid.js'
import * as History from './history.js'
import * as Keyboard from './keyboard.js'
import * as Mouse from './mouse.js'
import * as View from './view.js'
import * as Point from './point.js'
import * as Range from './range.js'

function restoreGrid(grid) {
  Grid.setGrid(grid)
  cursorChanged(grid.cursor)
  selectionChanged(Grid.getSelectionRange())
  for (const cell of grid.cells) {
    restoreCell(cell)
  }
}
function restoreCell(cell) {}

export function undo() {
  if (!History.canUndo()) return
  const grid = History.undo()
  restoreGrid(grid)
}

export function redo() {
  if (!History.canRedo()) return
  const grid = History.redo()
  restoreGrid(grid)
}

export function cursorChanged(cursor) {
  console.log('cursorChanged', cursor)
  View.showCursor(cursor)
  Keyboard.focus()
}
export function selectionChanged(selectionRange) {
  console.log('selectionChanged', selectionRange)
  View.showSelectionRange(selectionRange)
  const text = Grid.readRange(selectionRange)
  Keyboard.setValue(text)
  Keyboard.focus()
}

export function cellCreated(cell) {}
export function cellUpdated(cell) {}
export function cellMoved(cell) {}
export function cellRemoved(cell) {}

export function copy() {}
export function cut() {
  History.save(grid)
  const range = Grid.getSelectionRange()
  Grid.removeRange(range)
}

export function selectColumn() {
  const range = Grid.getSelectionRange()
  if (!range) return
  Grid.setCursorAndSelectionStart(
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
  const range = Grid.getSelectionRange()
  if (!range) return
  Grid.setCursorAndSelectionStart(
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
  Grid.clearSelection(grid)
}

export function compositionStateChange(compositionState, compositionText) {
  if (compositionState === 'end') {
    hideInputRange()
  } else if (compositionState === 'start') {
    showInputRange()
  }
  updateInputRange(compositionText)
}

export function insertText(text, type) {
  // Grid.insertText( text, type)
}

export function moveCursor(offset) {
  console.log('moveCursor', offset)
  Grid.setCursorAndSelectionStart(Point.add(grid.cursor, offset))
}

export function moveCursorAndSelect(offset) {
  Grid.setCursor(Point.add(grid.cursor, offset))
}

export function moveCursorAndDisplace(offset) {
  History.save(grid)
  Grid.displaceRangeBy(Grid.getSelectionRange(), offset)
  Grid.moveSelectionBy(offset)
}

export function eraseBackward(isWord) {}

export function eraseForward(isWord) {}

// Mouse stuff

export function leftClickStart(start, shiftKey) {
  const selectionRange = Grid.getSelectionRange()
  if (selectionRange && Range.contains(selectionRange, start)) {
    View.showDashedRange(selectionRange)
    return {
      move(current) {
        const offset = Point.sub(current, start)
        View.showDashedRange(Range.move(selectionRange, offset))
      },
      end(end) {
        View.hideDashedRange()
        const offset = Point.sub(end, start)
        if (offset.x === 0 && offset.y === 0) return
        History.save(grid)
        Grid.moveRangeBy(Grid.getSelectionRange(), offset)
      },
    }
  } else {
    if (shiftKey) {
      Grid.setCursor(start)
    } else {
      Grid.setCursorAndSelectionStart(start)
    }
    return {
      move(current) {
        Grid.setCursor(current)
      },
      end(end) {},
    }
  }
}

export function rightClickStart(start, shiftKey) {}
