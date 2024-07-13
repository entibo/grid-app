import { cellSize } from './global.js'
import {
  $cellCreated,
  $cellMoved,
  $cellRemoved,
  $cellRestored,
  $cellUpdated,
  $contentRange,
  $selectionRange,
} from './grid.js'
import { $textarea } from './keyboard.js'
import * as Point from './point.js'
import { computed, signal } from './signal.js'
import { clamp, debounce } from './util.js'

import * as Pan from './pan.js'

export function screenToGrid(screen) {
  const rect = originElement.getBoundingClientRect()
  const x = Math.floor((screen.x - rect.left) / cellSize)
  const y = Math.floor((screen.y - rect.top) / cellSize)
  return { x, y }
}

export const gridElement = document.createElement('div')
gridElement.className = 'grid'
gridElement.style.setProperty('--cell-size', `${cellSize}px`)
document.body.appendChild(gridElement)

export const $gridPixelDimensions = signal({ width: 0, height: 0 })
new ResizeObserver(() => {
  $gridPixelDimensions.set({
    width: gridElement.offsetWidth,
    height: gridElement.offsetHeight,
  })
}).observe(gridElement)

const gridBackgroundElement = document.createElement('div')
gridBackgroundElement.innerHTML = `<svg width="100%" height="100%">
  <defs>
    <pattern id="gridPattern" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse">
      <path d="M ${cellSize} 0 L 0 0 0 ${cellSize}"
            stroke="var(--grid-lines-color)" 
            stroke-width="1" 
            fill="none"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#gridPattern)" />
  </svg>`
const gridPatternElement = gridBackgroundElement.querySelector('pattern')
gridBackgroundElement.className = 'gridBackground'
gridElement.appendChild(gridBackgroundElement)

const scrollBoxElement = document.createElement('div')
scrollBoxElement.className = 'scrollBox'
gridElement.appendChild(scrollBoxElement)

const originElement = document.createElement('div')
originElement.className = 'origin'
scrollBoxElement.appendChild(originElement)

const cellsElement = document.createElement('div')
cellsElement.className = 'cells'
originElement.appendChild(cellsElement)

const cursorElement = document.createElement('div')
cursorElement.className = 'cursor'
originElement.appendChild(cursorElement)

const selectionRangeElement = document.createElement('div')
selectionRangeElement.className = 'range selectionRange'
originElement.appendChild(selectionRangeElement)

const dashedRangeElement = document.createElement('div')
dashedRangeElement.className = 'range dashedRange'
dashedRangeElement.style.display = 'none'
originElement.appendChild(dashedRangeElement)

// TODO: rename this "composition" or "preview" something
const inputRangeElement = document.createElement('div')
inputRangeElement.className = 'range inputRange'
// that's hacky
for (let x = 0; x < 30; x++) {
  originElement.appendChild(inputRangeElement)
  // Fake cells to display user input
  const cell = document.createElement('div')
  cell.className = 'cell preview'
  cell.style.display = 'none'
  inputRangeElement.appendChild(cell)
}

//

const cellIdToElementMap = new Map()

setInterval(() => {
  console.log('cellIdToElementMap.size:', cellIdToElementMap.size)
}, 10000)

//

function showElement(el) {
  el.style.display = 'block'
}

function hideElement(el) {
  el.style.display = 'none'
}

function setPosition(el, { x, y }) {
  el.style.translate = `${x}px ${y}px`
}

function setGridPosition(el, point) {
  setPosition(el, Point.scale(point, cellSize))
}

function setDimensions(el, { width, height }) {
  el.style.width = `${(width + 1) * cellSize}px`
  el.style.height = `${(height + 1) * cellSize}px`
}

//
import * as Range from './range.js'

// Positive offset representing by how much the content
// sticks out from 0,0 into negative coordinates
const $topLeftContentOffset = computed(
  [$selectionRange, $contentRange],
  (selectionRange, contentRange) => {
    return Point.scale(
      Range.getBoundingRange([selectionRange, contentRange]),
      cellSize,
    )
  },
)

$topLeftContentOffset.subscribe((offset) => {
  console.log('topLeftContentOffset', offset)
})

let scrollReference = { x: 0, y: 0 }

computed(
  [Pan.$offset, $topLeftContentOffset, $gridPixelDimensions],
  (panOffset, topLeftContentOffset, gridPixelDimensions) => {
    gridPatternElement.setAttribute(
      'patternTransform',
      `translate(${panOffset.x % cellSize} ${panOffset.y % cellSize})`,
    )

    if (false) {
      setPosition(originElement, panOffset)
      return
    }

    originElement.style.marginLeft = `${Math.max(
      panOffset.x,
      -topLeftContentOffset.x,
    )}px`
    originElement.style.marginTop = `${Math.max(
      panOffset.y,
      -topLeftContentOffset.y,
    )}px`

    const { x, y } = Point.add(panOffset, topLeftContentOffset)
    scrollReference = panOffset

    const scroll = {
      x: Math.max(-x, 0),
      y: Math.max(-y, 0),
    }

    if (scroll.x > 0) {
      const width = Math.ceil(
        scroll.x + gridPixelDimensions.width + topLeftContentOffset.x,
      )
      originElement.style.width = `${width}px`
    }

    if (scroll.y > 0) {
      const height = Math.ceil(
        scroll.y + gridPixelDimensions.height + topLeftContentOffset.y,
      )
      originElement.style.height = `${height}px`
    }

    scrollBoxElement.scroll({
      behavior: 'instant',
      left: scroll.x,
      top: scroll.y,
    })
  },
)

//

$cellCreated.subscribe(({ id, value, position }) => {
  const el = document.createElement('div')
  el.className = 'cell'
  cellsElement.appendChild(el)

  setGridPosition(el, position)
  el.textContent = value

  cellIdToElementMap.set(id, el)
})

// Same as cellCreated, except we are
// guaranteed that cellCreated was called
// with this id in the past
$cellRestored.subscribe(({ id, value, position }) => {
  const el = cellIdToElementMap.get(id)
  if (!el.isConnected) {
    cellsElement.appendChild(el)
  }

  setGridPosition(el, position)
  el.textContent = value
})

$cellUpdated.subscribe(({ id, value }) => {
  const el = cellIdToElementMap.get(id)
  el.textContent = value
})

$cellMoved.subscribe(({ id, position }) => {
  const el = cellIdToElementMap.get(id)
  setGridPosition(el, position)
})

$cellRemoved.subscribe(({ id }) => {
  const el = cellIdToElementMap.get(id)
  el.remove()
  // cellIdToElementMap.delete(id)
})

//

export function showCursor(position) {
  showElement(cursorElement)
  setGridPosition(cursorElement, position)
}

export function hideCursor() {
  hideElement(cursorElement)
}

//

export function showSelectionRange(range) {
  showElement(selectionRangeElement)
  setGridPosition(selectionRangeElement, range)
  setDimensions(selectionRangeElement, range)
}

export function hideSelectionRange() {
  hideElement(selectionRangeElement)
}

//

export function showDashedRange(range) {
  showElement(dashedRangeElement)
  setGridPosition(dashedRangeElement, range)
  setDimensions(dashedRangeElement, range)
}

export function hideDashedRange() {
  hideElement(dashedRangeElement)
}

//

export function showInputRange({ x, y }) {
  const range = { x, y, width: 0, height: 0 }
  inputRangeElement.style.display = 'flex'
  setGridPosition(inputRangeElement, range)
  setDimensions(inputRangeElement, range)

  // Move the text area so that IME can show up in the right place
  const rect = inputRangeElement.getBoundingClientRect()
  setPosition($textarea, rect)
}

export function updateInputRange({ x, y }, compositionText) {
  for (const cell of inputRangeElement.children) {
    hideElement(cell)
  }
  for (let i = 0; i < compositionText.length; i++) {
    const cell = inputRangeElement.children[i]
    cell.textContent = compositionText[i]
    cell.style.display = 'flex'
    cell.style.position = 'relative'
  }

  const range = {
    x,
    y,
    width: compositionText.length - 1,
    height: 0,
  }
  inputRangeElement.style.display = 'flex'
  setGridPosition(inputRangeElement, range)
  setDimensions(inputRangeElement, range)
}

export function hideInputRange() {
  hideElement(inputRangeElement)
  setDimensions(cursorElement, { width: 0, height: 0 })
}
