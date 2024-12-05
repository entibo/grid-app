import * as BrowserZoom from './browser-zoom.js'
import * as History from './history.js'
import * as Keyboard from './keyboard.js'
import * as Mouse from './mouse.js'
import * as Pan from './pan.js'
import * as Point from './point.js'
import * as Range from './range.js'
import * as Storage from './storage.js'
import { debounce } from './util.js'
import * as View from './view.js'
import * as Search from './search.js'
import { cellSize } from './global.js'
import { isFullWidth } from './fullwidth.js'
import * as Grid from './grid.js'
import * as Selection from './selection.js'

Selection.$selection.subscribe((selectionRange) => {
  if (true || selectionRange.width > 0 || selectionRange.height > 0) {
    View.showSelectionRange(selectionRange)
  } else {
    View.hideSelectionRange()
  }
})

//

const save = debounce(() => {
  const text = Grid.readRange(/* contentRange */)
  document.title = text.match(/^\s*(\S+)/)?.[1] || 'Empty grid'
  Storage.save(text)
}, 100)

export function checkpoint() {
  History.push({
    cellMap: Grid.$cellMap.value,
    selection: Selection.$selection.value,
  })
  save()
}

function restoreState({ selection, cellMap }) {
  Grid.setCellMap(cellMap)
  Selection.$selection.value = selection
}

export function undo() {
  if (!History.canUndo()) return
  restoreState(History.undo())
  save()
}

export function redo() {
  if (!History.canRedo()) return
  restoreState(History.redo())
  save()
}

// Init
setTimeout(async () => {
  const text = await Storage.load()
  if (text) {
    Grid.writeText({ x: 0, y: 0 }, text)
  }
  checkpoint()
})

//

export function copy() {}

export function cut() {
  Grid.removeRange(Selection.$selectionRange.value)
  checkpoint()
  // Keyboard.focus()
}

//

export function selectColumn() {
  const { start, end } = Selection.$selection.value
  const contentRange = Selection.$contentRange.value

  const top = contentRange.y
  const bottom = contentRange.y + contentRange.height
  const selectionGoesUp = start.y >= end.y

  Selection.select(
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
  const { start, end } = Selection.$selection.value
  const contentRange = Selection.$contentRange.value

  const left = contentRange.x
  const right = contentRange.x + contentRange.width
  const selectionGoesLeft = start.x >= end.x

  Selection.select(
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
  const selectionRange = Selection.$selectionRange.value

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
    View.showCursor(Selection.$selection.value.end)
    View.showSelectionRange(selectionRange)
  }
}

export function insertText(text, type) {
  console.log('insertText', text, type)

  const rawCursorPosition = Selection.$selection.value.end
  const selectionRange = Selection.$selectionRange.value
  const direction = { x: 1, y: 0 }
  const horizontal = direction.x !== 0

  if (/* selection is not empty */ true) {
    const removed = Grid.removeRange(selectionRange)
  }

  // TODO: direction
  const startPosition = Range.contentStart(selectionRange, horizontal)

  const lines = text.split('\n')
  let position = startPosition
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    Grid.push(position, line.length, direction)
    Grid.writeText(position, line)
    position = Point.nextLine(position, horizontal)
  }

  // const selectionRange = Selection.$selectionRange.value
  // Grid.insertText(Point.add(rawCursorPosition, direction), text, direction)
  moveCursor(Point.scale(direction, text.length))
  checkpoint()
}

export function overwriteText(text) {
  console.log('overwriteText', text)

  const selectionRange = Selection.$selectionRange.value
  const removed = Grid.removeRange(selectionRange)

  const bounds = Grid.writeText(selectionRange, text)

  if (bounds) {
    Selection.select(Point.add(Range.bottomRight(bounds), { x: 1, y: 0 }))
  }

  if (removed || bounds) checkpoint()
}

export function moveCursor(offset) {
  const rawCursorPosition = Selection.$selection.value.end
  const selectionRange = Selection.$selectionRange.value

  // Selection.select(Range.getAdjacentPosition(cursorRange, offset))
  Selection.select(
    Range.getAdjacentPosition(selectionRange, offset, rawCursorPosition),
  )
}

export function moveCursorAndSelect(offset) {
  const rawCursorPosition = Selection.$selection.value.end
  Selection.selectTo(Point.add(rawCursorPosition, offset))
  // TODO
  // const { cursorRange } = Selection.$selection()
  // Selection.selectTo(Range.getAdjacentPosition(cursorRange, offset))
  // Selection.selectTo(
  //   Range.getAdjacentPosition(cursorRange, offset, rawCursorPosition),
  // )
}

export function moveCursorAndDisplace(offset) {
  const selectionRange = Selection.$selectionRange.value
  // Todo: check width
  const displacementOffset = Grid.displaceRangeBy(selectionRange, offset)
  moveSelectionBy(displacementOffset)
  checkpoint()
}


export function spacebar() {
  const rawCursorPosition = Selection.$selection.value.end
  // TODO: direction
  const direction = { x: 1, y: 0 }
  Grid.push(rawCursorPosition, 1, direction)
  // Grid.push(Point.add(rawCursorPosition, direction))
  moveCursor(direction)
  checkpoint()
}
export function moveToNextLine() {
  moveCursor({ x: 0, y: 1 })
}

//

export function eraseBackward(isWord, direction = { x: 1, y: 0 }) {
  const cursor = Selection.$selection.value.end
  const selectionRange = Selection.$selectionRange.value
  const movementSize =
    1 + (direction.x !== 0 ? selectionRange.width : selectionRange.height)

  console.log('eraseBackward', selectionRange, movementSize)

  const rightRange = {
    x: selectionRange.x + selectionRange.width + 1,
    y: selectionRange.y,
    width: 0,
    height: selectionRange.height,
  }
  if (true || selectionRange.width > 0 || selectionRange.height > 0) {
    const removed = Grid.removeRange(selectionRange)
    if (removed) checkpoint()
    // return
  }

  for (const lineStart of Range.getPositions(rightRange)) {
    const { position: lineEnd } = Grid.getLengthUntilBlank(
      lineStart,
      2,
      direction,
    )
    // TODO: check if anything needs changing,
    // for optimization and for checkpoint purposes
    Grid.moveRangeBy(
      Range.fromPoints(lineStart, lineEnd),
      Point.scale(direction, -1 * movementSize),
    )
  }

  moveCursor(Point.scale(direction, -1))
  checkpoint()
}

export function eraseRange() {
  console.log('eraseRange')
  const selectionRange = Selection.$selectionRange.value
  const removed = Grid.removeRange(selectionRange)
  moveCursor({ x: -1, y: 0 })
  if (removed) checkpoint()
}

export function eraseForward(isWord) {
  console.log('eraseForward', isWord)
  const selectionRange = Selection.$selectionRange.value
  const removed = Grid.removeRange(selectionRange)
  moveCursor({ x: +1, y: 0 })
  if (removed) checkpoint()
}

// Mouse stuff

export function leftClickStart(screen, shiftKey) {
  console.log('leftClickStart', screen, shiftKey)
  Keyboard.focus()
  const start = View.screenToGridCell(screen)
  const selectionRange = Selection.$selectionRange.value
  if (selectionRange && Range.contains(selectionRange, start)) {
    View.showDashedRange(selectionRange)
    return {
      move(screen) {
        const current = View.screenToGridCell(screen)
        const offset = Point.sub(current, start)
        View.showDashedRange(Range.moveBy(selectionRange, offset))
      },
      end(screen) {
        const position = View.screenToGridCell(screen)
        View.hideDashedRange()
        const offset = Point.sub(position, start)
        if (offset.x === 0 && offset.y === 0) return
        const selectionRange = Selection.$selectionRange.value
        Grid.moveRangeBy(selectionRange, offset)
        moveSelectionBy(offset)
        checkpoint()
      },
    }
  } else {
    if (shiftKey) {
      Selection.selectTo(start)
    } else {
      Selection.select(start)
    }
    return {
      move(screen) {
        const position = View.screenToGridCell(screen)
        Selection.selectTo(position)
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

BrowserZoom.onZoom(({ cursorOffset }) => {
  Pan.moveBy(cursorOffset, false)
})

//

addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    if (Search.$isOpen.value) {
      Search.open('')
      return
    }
    // TODO: selected text should be read once when selection is made
    const selectionRange = Selection.$selectionRange.value
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
  const { x, y } = Selection.$selection.value.end

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
  Selection.select({ x, y }, { x: x + width, y: y + height })

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
