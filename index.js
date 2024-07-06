import * as BrowserZoom from './browser-zoom.js'
import * as Grid from './grid.js'
import { grid } from './grid.js'
import * as History from './history.js'
import * as Keyboard from './keyboard.js'
import * as Mouse from './mouse.js'
import * as Pan from './pan.js'
import * as Point from './point.js'
import * as Range from './range.js'
import { debounce } from './util.js'
import * as View from './view.js'

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
  gridChanged()
}

var gridChanged = debounce(function () {
  console.log('grid changeded')
}, 10)

export function cellCreated(cell) {
  gridChanged()
  View.cellCreated(cell)
}
export function cellUpdated(cell) {
  gridChanged()
  View.cellUpdated(cell)
}
export function cellMoved(cell, previousCell) {
  gridChanged()
  gridChanged()
  View.cellMoved(cell)
}
export function cellRemoved(cell) {
  gridChanged()
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
  const scale = Math.min(selectionRange.dx, selectionRange.dy) + 1

  if (compositionState === 'start') {
    View.showInputRange(selectionRange, scale)
    View.hideCursor()
    View.hideSelectionRange()

    if (Grid.removeRange(selectionRange)) {
      checkpoint()
    }
  }

  if (compositionState === 'update') {
    // View.showSelectionRange(compositionRange)
    View.updateInputRange(selectionRange, compositionText)
  }

  if (compositionState === 'end') {
    console.log('composition end')
    // Grid.setCursorAndSelectionStart(compositionStart)
    View.hideInputRange()
    View.showCursor(grid.cursor)
    View.showSelectionRange(selectionRange)
  }
}

export function insertText(text, type) {
  console.log('insertText', text, type)

  const selectionRange = Grid.getSelectionRange()
  const cursorCorner = Range.whichCornerIs(selectionRange, grid.cursor)
  const scale = Math.min(selectionRange.dx, selectionRange.dy) + 1

  const removed = Grid.removeRange(selectionRange)

  const bounds = Grid.insertText(selectionRange, text, scale)

  if (bounds) {
    const newSelectionRange = {
      x: bounds.x + bounds.dx + 1,
      y: bounds.y,
      dx: scale - 1,
      dy: scale - 1,
    }
    Grid.setCursorAndSelectionStart(
      Range.getCorner(newSelectionRange, cursorCorner),
      Range.getCorner(newSelectionRange, Range.oppositeCorner(cursorCorner)),
    )
  }

  // Grid.setCursorAndSelectionStart({
  //   x: bounds.x + bounds.dx + 1,
  //   y: bounds.y + bounds.dy,
  // })
  if (removed || bounds) checkpoint()
}

export function moveCursor(offset) {
  const selectionRange = Grid.getSelectionRange()
  const cursorCorner = Range.whichCornerIs(selectionRange, grid.cursor)
  const scale = Math.min(selectionRange.dx, selectionRange.dy) + 1

  const newSelectionRange = {
    ...selectionRange,
    dx: scale - 1,
    dy: scale - 1,
  }

  console.log(newSelectionRange, scale, offset)

  if (offset.x > 0) newSelectionRange.x += selectionRange.dx + 1
  if (offset.y > 0) newSelectionRange.y += selectionRange.dy + 1
  if (offset.x < 0) newSelectionRange.x -= scale
  if (offset.y < 0) newSelectionRange.y -= scale

  Grid.setCursorAndSelectionStart(
    Range.getCorner(newSelectionRange, cursorCorner),
    Range.getCorner(newSelectionRange, Range.oppositeCorner(cursorCorner)),
  )
}

export function moveCursorAndSelect(offset) {
  Grid.setCursor(Point.add(grid.cursor, offset))
}

export function moveCursorAndDisplace(offset) {
  Grid.displaceRangeBy(Grid.getSelectionRange(), offset)
  checkpoint()
}

export function eraseBackward(isWord) {
  console.log('eraseBackward', isWord)
  const range = Grid.getSelectionRange()
  const removed = Grid.removeRange(range)
  moveCursor({ x: -1, y: 0 })
  if (removed) checkpoint()
}

export function eraseForward(isWord) {
  console.log('eraseForward', isWord)
  const range = Grid.getSelectionRange()
  const removed = Grid.removeRange(range)
  moveCursor({ x: +1, y: 0 })
  if (removed) checkpoint()
}

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

export function rightClickStart(screen, ctrlKey) {
  return Pan.startPanning(screen)
}

Mouse.onScroll((offset) => {
  Pan.panBy(offset, true)
})

BrowserZoom.onZoom((offset) => {
  Pan.panBy(offset, false)
})

export function panChanged(panOffset) {
  // console.log('panChanged', panOffset)
  View.showPanOffset(panOffset)
}

//
//
//

checkpoint()
