import * as BrowserZoom from './browser-zoom.js'
import * as Grid from './grid.js'
import * as History from './history.js'
import * as Keyboard from './keyboard.js'
import * as Mouse from './mouse.js'
import * as Pan from './pan.js'
import * as Point from './point.js'
import * as Range from './range.js'
import { readHash, writeHash } from './storage.js'
import { debounce } from './util.js'
import * as View from './view.js'

Grid.$selection.subscribe(({ end }) => {
  View.showCursor(end)
  // Keyboard.focus()
})

Grid.$selectionRange.subscribe((selectionRange) => {
  if (true || selectionRange.width > 0 || selectionRange.height > 0) {
    View.showSelectionRange(selectionRange)
  } else {
    View.hideSelectionRange()
  }

  const text = Grid.readRange(selectionRange)
  Keyboard.setValue(text)
  // Keyboard.focus()
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
  // Keyboard.focus()
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
  // TODO: check width
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
  console.log('leftClickStart', screen, shiftKey)
  Keyboard.focus()
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

//

import * as Search from './search.js'
import { cellSize } from './global.js'
import { isFullWidth } from './fullwidth.js'

addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    if (Search.$isOpen()) {
      Search.open('')
      return
    }
    const selectedText = Grid.readRange(Grid.$selectionRange())
    Search.open(selectedText)
  }
})

Search.$isOpen.subscribe((isOpen) => {
  if (isOpen) return
  // Return focus to the grid
  Keyboard.focus()
})

Search.$onSearch.subscribe((text) => {
  const results = Grid.search(text)

  const { x, y } = Grid.$selection().end

  let minDistance = Infinity
  let closestResultIndex = 0

  for (const [i, r] of results.entries()) {
    const distance = Math.abs(x - r.x) + Math.abs(y - r.y)
    if (distance < minDistance) {
      minDistance = distance
      closestResultIndex = i
    }
  }

  const reorderedResults = [
    ...results.slice(closestResultIndex),
    ...results.slice(0, closestResultIndex),
  ]

  Search.$searchResults.set(reorderedResults)
})

Search.$highlightedResult.subscribe((result) => {
  console.log('highlighted result', result)
  if (!result) return
  const { x, y, width, height } = result
  Grid.select({ x, y }, { x: x + width, y: y + height })

  scrollIntoView(result)
})

const scrollIntoViewPadding = 2 * cellSize.height
function scrollIntoView(range) {
  const panOffset = Pan.$offset()
  const gridPixelDimensions = View.$gridPixelDimensions()

  // Range boundaries
  const rangeLeft = range.x * cellSize.width
  const rangeTop = range.y * cellSize.height
  const rangeRight = rangeLeft + (range.width + 1) * cellSize.width
  const rangeBottom = rangeTop + (range.height + 1) * cellSize.height

  // Current viewport boundaries
  const viewportLeft = -panOffset.x
  const viewportTop = -panOffset.y
  const viewportRight = viewportLeft + gridPixelDimensions.width
  const viewportBottom = viewportTop + gridPixelDimensions.height

  // Calculate new panOffset
  let newViewportX = -panOffset.x
  let newViewportY = -panOffset.y

  if (rangeLeft < viewportLeft + scrollIntoViewPadding) {
    newViewportX = rangeLeft - scrollIntoViewPadding
  } else if (rangeRight > viewportRight - scrollIntoViewPadding) {
    newViewportX =
      rangeRight - gridPixelDimensions.width + scrollIntoViewPadding
  }

  if (rangeTop < viewportTop + scrollIntoViewPadding) {
    newViewportY = rangeTop - scrollIntoViewPadding
  } else if (rangeBottom > viewportBottom - scrollIntoViewPadding) {
    newViewportY =
      rangeBottom - gridPixelDimensions.height + scrollIntoViewPadding
  }

  Pan.moveTo({ x: -newViewportX, y: -newViewportY }, true)
}

//
//
//
