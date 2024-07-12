import * as BrowserZoom from './browser-zoom.js'
import * as Grid from './grid.js'
import * as History from './history.js'
import * as Keyboard from './keyboard.js'
import * as Mouse from './mouse.js'
import * as Pan from './pan.js'
import * as Point from './point.js'
import * as Range from './range.js'
import { debounce } from './util.js'
import * as View from './view.js'
import { cellSize } from './global.js'
import * as Scrollbars from './scrollbars.js'
import { signal, computed } from './signal.js'
import { readHash, writeHash } from './storage.js'

Grid.$selection.subscribe(({ end }) => {
  View.showCursor(end)
  Keyboard.focus()
})

Grid.$selectionRange.subscribe((selectionRange) => {
  View.showSelectionRange(selectionRange)

  const text = Grid.readRange(selectionRange)
  Keyboard.setValue(text)
  Keyboard.focus()
})

//

const save = debounce(() => {
  const text = Grid.readRange(Grid.$contentRange())
  document.title = text.match(/^\S{1,20}/)?.[0] || 'Empty grid'
  writeHash(text)
}, 100)

export function checkpoint() {
  History.push(Grid.getGrid())
  save()
}

export function undo() {
  if (!History.canUndo()) return
  const grid = History.undo()
  Grid.setGrid(grid)
  save()
}

export function redo() {
  if (!History.canRedo()) return
  const grid = History.redo()
  Grid.setGrid(grid)
  save()
}

// Init
setTimeout(async () => {
  const text = await readHash()
  if (text) {
    Grid.insertText({ x: 0, y: 0 }, text)
  }
  checkpoint()
})

//

export function copy() {}

export function cut() {
  const selectionRange = Grid.$selectionRange()
  Grid.removeRange(selectionRange)
  checkpoint()
  Keyboard.focus()
}

//

export function selectColumn() {
  const { start, end } = Grid.$selection()
  const contentRange = Grid.$contentRange()

  const top = contentRange.y
  const bottom = contentRange.y + contentRange.height
  const selectionGoesUp = start.y >= end.y

  Grid.select(
    {
      x: start.x,
      y: selectionGoesUp ? bottom : top,
    },
    {
      x: end.x,
      y: selectionGoesUp ? top : bottom,
    },
  )
}

export function selectRow() {
  const { start, end } = Grid.$selection()
  const contentRange = Grid.$contentRange()

  const left = contentRange.x
  const right = contentRange.x + contentRange.width
  const selectionGoesLeft = start.x >= end.x

  Grid.select(
    {
      x: selectionGoesLeft ? right : left,
      y: start.y,
    },
    {
      x: selectionGoesLeft ? left : right,
      y: end.y,
    },
  )
}

export function selectAll() {
  selectColumn()
  selectRow()
}

export function clearSelection() {
  Grid.clearSelection()
}

export function compositionStateChange(compositionState, compositionText) {
  const selectionRange = Grid.$selectionRange()

  if (compositionState === 'start') {
    View.showInputRange(selectionRange)
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
    View.showCursor(Grid.$selection().end)
    View.showSelectionRange(selectionRange)
  }
}

export function insertText(text, type) {
  console.log('insertText', text, type)

  const selectionRange = Grid.$selectionRange()

  const removed = Grid.removeRange(selectionRange)

  const bounds = Grid.insertText(selectionRange, text)

  if (bounds) {
    Grid.select(Point.add(Range.bottomRight(bounds), { x: 1, y: 0 }))
  }

  if (removed || bounds) checkpoint()
}

export function moveCursor(offset) {
  // Grid.clearSelection()
  // moveSelectionBy(offset)
  const { end } = Grid.$selection()
  Grid.select(Point.add(end, offset))
}

export function moveCursorAndSelect(offset) {
  const { end } = Grid.$selection()
  Grid.selectTo(Point.add(end, offset))
}

export function moveCursorAndDisplace(offset) {
  const selectionRange = Grid.$selectionRange()
  Grid.displaceRangeBy(selectionRange, offset)
  moveSelectionBy(offset)
  checkpoint()
}

function moveSelectionBy(offset) {
  Grid.$selection.update(({ start, end }) => {
    return {
      start: Point.add(start, offset),
      end: Point.add(end, offset),
    }
  })
}

export function moveToNextCell() {
  moveCursor({ x: 1, y: 0 })
}
export function moveToNextLine() {
  moveCursor({ x: 0, y: 1 })
}

export function eraseBackward(isWord) {
  console.log('eraseBackward', isWord)
  const selectionRange = Grid.$selectionRange()
  const removed = Grid.removeRange(selectionRange)
  moveCursor({ x: -1, y: 0 })
  if (removed) checkpoint()
}

export function eraseForward(isWord) {
  console.log('eraseForward', isWord)
  const selectionRange = Grid.$selectionRange()
  const removed = Grid.removeRange(selectionRange)
  moveCursor({ x: +1, y: 0 })
  if (removed) checkpoint()
}

// Mouse stuff

export function leftClickStart(screen, shiftKey) {
  const start = View.screenToGrid(screen)
  const selectionRange = Grid.$selectionRange()
  if (selectionRange && Range.contains(selectionRange, start)) {
    View.showDashedRange(selectionRange)
    return {
      move(screen) {
        const current = View.screenToGrid(screen)
        const offset = Point.sub(current, start)
        View.showDashedRange(Range.moveBy(selectionRange, offset))
      },
      end(screen) {
        const position = View.screenToGrid(screen)
        View.hideDashedRange()
        const offset = Point.sub(position, start)
        if (offset.x === 0 && offset.y === 0) return
        const selectionRange = Grid.$selectionRange()
        Grid.moveRangeBy(selectionRange, offset)
        moveSelectionBy(offset)
        checkpoint()
      },
    }
  } else {
    if (shiftKey) {
      Grid.selectTo(start)
    } else {
      Grid.select(start)
    }
    return {
      move(screen) {
        const position = View.screenToGrid(screen)
        Grid.selectTo(position)
      },
      end(screen) {},
    }
  }
}

export function rightClickStart(screen, ctrlKey) {
  return Pan.startPanning(screen)
}

Mouse.onScroll.subscribe((offset) => {
  // Pan.panBy(offset, true)
})

BrowserZoom.onZoom.subscribe((offset) => {
  Pan.moveBy(offset, false)
})

Pan.$offset.subscribe((offset) => {
  View.showPanOffset(offset)
})

//

Scrollbars.mount(View.$grid)

let movedCameraUsingScrollbars = false
const extensionAmount = 0 * cellSize
let scrollRange = { x: 0, y: 0, width: 0, height: 0 }

// TODO:
Scrollbars.onScroll.subscribe((scrollOffset) => {
  const viewPosition = Point.add(
    scrollRange,
    scrollOffset /* {
    x: extensionAmount,
    y: extensionAmount,
  } */,
  )

  movedCameraUsingScrollbars = true
  Pan.$offset.set(Point.scale(viewPosition, -1))
})

computed(
  [
    Pan.$offset,
    View.$gridPixelDimensions,
    Grid.$selectionRange,
    Grid.$contentRange,
  ],
  (panOffset, gridPixelDimensions, selectionRange, contentRange) => {
    if (movedCameraUsingScrollbars) {
      movedCameraUsingScrollbars = false
      return
    }

    const viewPosition = Point.scale(panOffset, -1)

    const viewRange = {
      ...viewPosition,
      ...gridPixelDimensions,
    }

    const extendedViewRange = {
      x: viewRange.x - extensionAmount,
      y: viewRange.y - extensionAmount,
      width: viewRange.width + extensionAmount * 2,
      height: viewRange.height + extensionAmount * 2,
    }

    scrollRange = Range.getBoundingRange([
      rangeGridToScreen(contentRange),
      rangeGridToScreen(selectionRange),
      extendedViewRange,
    ])

    const { width, height } = scrollRange
    const scrollOffset = Point.sub(viewPosition, scrollRange /* xy */)
    Scrollbars.update({ width, height }, scrollOffset)
  },
)

function rangeGridToScreen(range) {
  return {
    ...Point.scale(range, cellSize),
    width: (range.width + 1) * cellSize,
    height: (range.height + 1) * cellSize,
  }
}

//
//
//
