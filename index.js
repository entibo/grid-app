import * as BrowserZoom from './browser-zoom.js'
import * as Grid from './grid.js'
import * as History from './history.js'
import * as Keyboard from './keyboard.js'
import * as Mouse from './mouse.js'
import * as Pan from './pan.js'
import * as Point from './point.js'
import * as Range from './range.js'
import * as Storage from './storage.js'
import { debounce } from './util.js'
import * as View from './view.js'

Grid.$selection.subscribe((selectionRange) => {
  if (true || selectionRange.width > 0 || selectionRange.height > 0) {
    View.showSelectionRange(selectionRange)
  } else {
    View.hideSelectionRange()
  }

  // TODO
  const text = Grid.readRange(selectionRange)
  Keyboard.setValue(text)
  // Keyboard.focus()
})

//

const save = debounce(() => {
  const text = Grid.readRange(/* contentRange */)
  document.title = text.match(/^\S{1,20}/)?.[0] || 'Empty grid'
  Storage.save(text)
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
  const text = await Storage.load()
  if (text) {
    Grid.overwriteText({ x: 0, y: 0 }, text)
  }
  checkpoint()
})

//

export function copy() {}

export function cut() {
  Grid.removeRange(Grid.$selectionRange.value)
  checkpoint()
  // Keyboard.focus()
}

//

export function selectColumn() {
  const { start, end } = Grid.$selection
  const contentRange = Grid.$contentRange.value

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
  const { start, end } = Grid.$selection
  const contentRange = Grid.$contentRange.value

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
  const selectionRange = Grid.$selectionRange.value

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
    View.showCursor(Grid.$selection.end)
    View.showSelectionRange(selectionRange)
  }
}

export function insertText(text, type) {
  console.log('insertText', text, type)

  if (text.match(/\n/)) {
    overwriteText(text)
    return
  }

  // TODO
  const cursorRange = Grid.$selection().cursorRange

  for (let i = 0; i < text.length; i++) {
    Grid.push({
      x: cursorRange.x + i,
      y: cursorRange.y,
    })
  }

  overwriteText(text)
}

export function overwriteText(text) {
  console.log('overwriteText', text)

  const selectionRange = Grid.$selectionRange.value
  const removed = Grid.removeRange(selectionRange)

  const bounds = Grid.overwriteText(selectionRange, text)

  if (bounds) {
    Grid.select(Point.add(Range.bottomRight(bounds), { x: 1, y: 0 }))
  }

  if (removed || bounds) checkpoint()
}

export function moveCursor(offset) {
  const rawCursorPosition = Grid.$selection.end
  const selectionRange = Grid.$selectionRange.value

  // Grid.select(Range.getAdjacentPosition(cursorRange, offset))
  Grid.select(
    Range.getAdjacentPosition(selectionRange, offset, rawCursorPosition),
  )
}

export function moveCursorAndSelect(offset) {
  const rawCursorPosition = Grid.$selection.end
  // TODO
  const { cursorRange } = Grid.$selection()
  // Grid.selectTo(Range.getAdjacentPosition(cursorRange, offset))
  Grid.selectTo(
    Range.getAdjacentPosition(cursorRange, offset, rawCursorPosition),
  )
}

export function moveCursorAndDisplace(offset) {
  const selectionRange = Grid.$selectionRange.value
  // Todo: check width
  const displacementOffset = Grid.displaceRangeBy(selectionRange, offset)
  moveSelectionBy(displacementOffset)
  checkpoint()
}

function moveSelectionBy(offset) {
  const { start, end } = Grid.$selection.value
  Grid.$selection.value = {
    start: Point.add(start, offset),
    end: Point.add(end, offset),
  }
}

export function spacebar() {
  const rawCursorPosition = Grid.$selection.end
  Grid.push(rawCursorPosition)
  moveCursor({ x: 1, y: 0 })
  checkpoint()
}
export function moveToNextLine() {
  moveCursor({ x: 0, y: 1 })
}

//

function push(position, direction) {
  // direction is assumed "right"
}

//

export function eraseBackward(isWord) {
  console.log('eraseBackward')
  const selectionRange = Grid.$selectionRange.value
  if (selectionRange.width > 0 || selectionRange.height > 0) {
    // const removed = Grid.removeRange(selectionRange)
    // if (removed) checkpoint()
    return
  }

  // TODO
  Grid.moveRangeBy(Grid.$paragraphRange(), { x: -1, y: 0 })
  moveCursor({ x: -1, y: 0 })
  checkpoint()
}

export function eraseRange() {
  console.log('eraseRange')
  const selectionRange = Grid.$selectionRange.value
  const removed = Grid.removeRange(selectionRange)
  moveCursor({ x: -1, y: 0 })
  if (removed) checkpoint()
}

export function eraseForward(isWord) {
  console.log('eraseForward', isWord)
  const selectionRange = Grid.$selectionRange.value
  const removed = Grid.removeRange(selectionRange)
  moveCursor({ x: +1, y: 0 })
  if (removed) checkpoint()
}

// Mouse stuff

export function leftClickStart(screen, shiftKey) {
  console.log('leftClickStart', screen, shiftKey)
  Keyboard.focus()
  const start = View.screenToGrid(screen)
  const selectionRange = Grid.$selectionRange.value
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
        const selectionRange = Grid.$selectionRange.value
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

export function rightClickStart(screen) {
  return Pan.startPanning(screen)
}

Mouse.onScroll((offset) => {
  // Pan.panBy(offset, true)
})

BrowserZoom.onZoom(({cursorOffset}) => {
  Pan.moveBy(cursorOffset, false)
})

//

import * as Search from './search.js'
import { cellSize } from './global.js'
import { isFullWidth } from './fullwidth.js'

addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    if (Search.$isOpen.value) {
      Search.open('')
      return
    }
    // TODO: selected text should be read once when selection is made
    const selectionRange = Grid.$selectionRange.value
    const selectedText = Grid.readRange(selectionRange)
    Search.open(selectedText)
  }
})

Search.$isOpen.subscribe((isOpen) => {
  if (isOpen) return
  // Return focus to the grid
  Keyboard.focus()
})

Search.onSearch((text) => {
  const results = Grid.search(text)

  // Reorder results so that the closest match is first
  const { x, y } = Grid.$selection.end

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

  Search.$searchResults.value = reorderedResults
})

Search.$highlightedResult.subscribe((result) => {
  console.log('highlighted result', result)
  if (!result) return
  const { x, y, width, height } = result
  Grid.select({ x, y }, { x: x + width, y: y + height })

  scrollIntoView(result)
})

const scrollIntoViewPadding = 2 * cellSize
function scrollIntoView(range) {
  const panOffset = Pan.$offset.value
  const gridPixelDimensions = View.$gridPixelDimensions.value

  // Range boundaries
  const rangeLeft = range.x * cellSize
  const rangeTop = range.y * cellSize
  const rangeRight = rangeLeft + (range.width + 1) * cellSize
  const rangeBottom = rangeTop + (range.height + 1) * cellSize

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
