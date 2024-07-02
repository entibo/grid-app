import * as Grid from './grid.js'
import { grid } from './grid.js'
import * as History from './history.js'
import * as Keyboard from './keyboard.js'
import * as Mouse from './mouse.js'
import * as View from './view.js'
import * as Point from './point.js'
import * as Range from './range.js'
import * as Pan from './pan.js'

function restoreGrid(grid) {
  console.log('restoreGrid', grid)

  const oldCellIds = new Set(Grid.getCells().map((cell) => cell.id))

  Grid.setGrid(grid)

  for (const cell of Grid.getCells()) {
    View.cellRestored(cell)
    oldCellIds.delete(cell.id)
  }

  for (const id of oldCellIds) {
    View.cellRemoved({ id })
  }

  cursorChanged(grid.cursor)
  selectionChanged(Grid.getSelectionRange())
}

export function cellCreated(cell) {
  View.cellCreated(cell)
}
export function cellUpdated(cell) {
  View.cellUpdated(cell)
}
export function cellMoved(cell) {
  View.cellMoved(cell)
}
export function cellRemoved(cell) {
  View.cellRemoved(cell)
}
export function cursorChanged(cursor) {
  if (!cursor) {
    View.hideCursor()
    return
  }
  View.showCursor(cursor)
  Keyboard.focus()
}
export function selectionChanged(selectionRange) {
  if (!selectionRange) {
    View.hideSelectionRange()
    return
  }
  View.showSelectionRange(selectionRange)
  const text = Grid.readRange(selectionRange)
  console.log(
    'selectionChanged',
    selectionRange,
    text,
    Grid.getCells().filter((cell) =>
      Range.contains(selectionRange, cell.position),
    ),
  )
  Keyboard.setValue(text)
  Keyboard.focus()
}

//

export function checkpoint() {
  History.push(grid)
}

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

//

export function copy() {
  console.log('copy')
}

export function cut() {
  console.log('cut')
  const range = Grid.getSelectionRange()
  Grid.removeRange(range)
  checkpoint()
  Keyboard.focus()
}

//

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
  const selectionRange = Grid.getSelectionRange()
  if (compositionState === 'end') {
    View.hideInputRange()
  } else if (compositionState === 'start') {
    View.showInputRange(selectionRange)
  } else {
    View.updateInputRange(selectionRange, compositionText)
  }
}

export function insertText(text, type) {
  console.log('insertText', text, type)
  Grid.insertText(text)
  checkpoint()
  
}

export function moveCursor(offset) {
  console.log('moveCursor', offset)
  Grid.setCursorAndSelectionStart(Point.add(grid.cursor, offset))
}

export function moveCursorAndSelect(offset) {
  Grid.setCursor(Point.add(grid.cursor, offset))
}

export function moveCursorAndDisplace(offset) {
  Grid.displaceRangeBy(Grid.getSelectionRange(), offset)
  Grid.moveSelectionBy(offset)
  checkpoint()
}

export function eraseBackward(isWord) {
  console.log('eraseBackward', isWord)
  Grid.removeRange(Grid.getSelectionRange())
  Grid.setCursorAndSelectionStart({
    x: grid.cursor.x - 1,
    y: grid.cursor.y,
  })
  checkpoint()
}

export function eraseForward(isWord) {}

// Mouse stuff

export function leftClickStart(screen, shiftKey) {
  const start = View.screenToGrid(screen)
  const selectionRange = Grid.getSelectionRange()
  if (selectionRange && Range.contains(selectionRange, start)) {
    View.showDashedRange(selectionRange)
    return {
      move(screen) {
        const current = View.screenToGrid(screen)
        const offset = Point.sub(current, start)
        View.showDashedRange(Range.move(selectionRange, offset))
      },
      end(screen) {
        const position = View.screenToGrid(screen)
        View.hideDashedRange()
        const offset = Point.sub(position, start)
        if (offset.x === 0 && offset.y === 0) return
        Grid.moveRangeBy(Grid.getSelectionRange(), offset)
        checkpoint()
      },
    }
  } else {
    if (shiftKey) {
      Grid.setCursor(start)
    } else {
      Grid.setCursorAndSelectionStart(start)
    }
    return {
      move(screen) {
        const position = View.screenToGrid(screen)
        Grid.setCursor(position)
      },
      end(screen) {},
    }
  }
}

export function rightClickStart(screen, shiftKey) {
  return Pan.start(screen)
}

export function scroll(delta) {
  Pan.move(delta)
}

export function panChanged(panOffset) {
  // console.log('panChanged', panOffset)
  View.showPanOffset(panOffset)
}

//
//
//

checkpoint()
