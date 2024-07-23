import { cellSize } from './global.js'
import {
  $cellCreated,
  $cellMoved,
  $cellRemoved,
  $cellRestored,
  $cellUpdated,
  $contentRange,
  $paragraphRange,
  $selection,
} from './grid.js'
import { textareaElement } from './keyboard.js'
import * as Point from './point.js'
import { computed, signal } from './signal.js'
import { clamp, debounce } from './util.js'

import * as Pan from './pan.js'

export function screenToGrid(screen) {
  const rect = originElement.getBoundingClientRect()
  const x = Math.floor((screen.x - rect.left) / cellSize.width)
  const y = Math.floor((screen.y - rect.top) / cellSize.height)
  return { x, y }
}

document.documentElement.style.setProperty(
  '--cell-width',
  `${cellSize.width}px`,
)
document.documentElement.style.setProperty(
  '--cell-height',
  `${cellSize.height}px`,
)

// document.body.classList.add('press-start-2p')
// document.body.classList.add('zen-maru-gothic')
// document.body.classList.add('inconsolata')
// document.body.classList.add('brush')
// document.body.classList.add('courier')

export const gridElement = document.createElement('div')
gridElement.className = 'grid'
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
    <pattern id="gridPattern" width="${cellSize.width}" height="${cellSize.height}" patternUnits="userSpaceOnUse">
      <path d="M ${cellSize.width} 0 L 0 0 0 ${cellSize.height}"
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
cursorElement.className = 'range cursor'
originElement.appendChild(cursorElement)

const dashedRangeElement = document.createElement('div')
dashedRangeElement.className = 'range dashedRange'
dashedRangeElement.style.display = 'none'
originElement.appendChild(dashedRangeElement)

// TODO: rename this "composition" or "preview" something
const inputRangeElement = document.createElement('div')
inputRangeElement.className = 'range inputRange'
// that's hacky
for (let x = 0; x < 30; x++) {
  // Fake cells to display user input
  const cell = document.createElement('div')
  cell.className = 'cell preview'
  cell.style.display = 'none'
  inputRangeElement.appendChild(cell)
}
originElement.appendChild(inputRangeElement)

const selectionRangeElement = document.createElement('div')
selectionRangeElement.className = 'range selectionRange'
originElement.appendChild(selectionRangeElement)

//

const paragraphRangeElement = document.createElement('div')
paragraphRangeElement.className = 'range paragraphRange'
originElement.appendChild(paragraphRangeElement)
$paragraphRange.subscribe((range) => {
  console.log('paragraphRange', range)
  setGridPosition(paragraphRangeElement, range)
  setGridDimensions(paragraphRangeElement, range)
})

//

$selection.subscribe(({ range, cursorRange }) => {
  setGridPosition(cursorElement, cursorRange)
  setGridDimensions(cursorElement, cursorRange)

  setGridPosition(selectionRangeElement, range)
  setGridDimensions(selectionRangeElement, range)
})

//

import * as Search from './search.js'

const searchElement = document.createElement('div')
searchElement.className = 'search'
originElement.appendChild(searchElement)

computed([Search.$isOpen, Search.$highlightedResult], (isOpen, result) => {
  gridElement.classList.toggle('searching', isOpen)
  searchElement.style.display = isOpen ? 'block' : 'none'
  selectionRangeElement.style.display = isOpen && !result ? 'none' : 'block'
})

Search.$searchResults.subscribe((results) => {
  searchElement.innerHTML = ''
  for (const { x, y, width, height } of results) {
    const cell = document.createElement('div')
    cell.className = 'range searchResult'
    cell.style.translate = `${x * cellSize.width}px ${y * cellSize.height}px`
    cell.style.width = `${(width + 1) * cellSize.width}px`
    cell.style.height = `${(height + 1) * cellSize.height}px`
    searchElement.appendChild(cell)
  }
})

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

function setGridDimensions(el, { width, height }) {
  el.style.width = `${(width + 1) * cellSize.width}px`
  el.style.height = `${(height + 1) * cellSize.height}px`
}

//

let didScroll = false
let scrollReference = { x: 0, y: 0 }

computed(
  [Pan.$offset, $contentRange, $gridPixelDimensions],
  (panOffset, contentRange, gridPixelDimensions) => {
    // console.log(panOffset, contentRange, gridPixelDimensions)

    gridPatternElement.setAttribute(
      'patternTransform',
      `translate(${panOffset.x % cellSize.width} ${
        panOffset.y % cellSize.height
      })`,
    )

    if (panOffset.fromScrollEvent) return

    // console.log('panOffset maybe changed,', panOffset)
    setPosition(originElement, panOffset)

    const scroll = Point.round(
      Point.scale(
        Point.add(panOffset, Point.scale(contentRange, cellSize)),
        -1,
      ),
    )

    scrollReference = Point.scale(
      {
        x: Math.max(0, panOffset.x),
        y: Math.max(0, panOffset.y),
      },
      -1,
    )

    if (scroll.x > 0) {
      originElement.style.left = `${scroll.x}px`
      const width = Math.ceil(scroll.x + gridPixelDimensions.width)
      originElement.style.width = width + 'px'
    } else {
      originElement.style.left = '0px'
      originElement.style.width = ''
    }

    if (scroll.y > 0) {
      originElement.style.top = `${scroll.y}px`
      const height = Math.ceil(scroll.y + gridPixelDimensions.height)
      originElement.style.height = height + 'px'
    } else {
      originElement.style.top = '0px'
      originElement.style.height = ''
    }

    didScroll = true
    scrollBoxElement.scrollLeft = scroll.x
    scrollBoxElement.scrollTop = scroll.y
  },
)

scrollBoxElement.addEventListener('scroll', (e) => {
  if (didScroll) {
    didScroll = false
    return
  }
  const { scrollLeft, scrollTop } = e.target

  const scroll = { x: scrollLeft, y: scrollTop }

  const newPanOffset = Point.sub(Point.scale(scroll, -1), scrollReference)

  // console.log('scroll event', scrollLeft, scrollTop, '=>', newPanOffset)

  Pan.$offset.set({ ...newPanOffset, fromScrollEvent: true })
  // TODO: this doesn't work idk why
  Pan.stop()
})

//

function setCellValue(el, { text, width }) {
  el.textContent = text
  el.classList.toggle('wide', width === 2)
}

$cellCreated.subscribe(({ id, value, position }) => {
  const el = document.createElement('div')
  el.className = 'cell'
  cellsElement.appendChild(el)

  setGridPosition(el, position)
  setCellValue(el, value)

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

  setCellValue(el, value)
  setGridPosition(el, position)
})

$cellUpdated.subscribe(({ id, value }) => {
  const el = cellIdToElementMap.get(id)
  setCellValue(el, value)
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
  setGridDimensions(selectionRangeElement, range)
}

export function hideSelectionRange() {
  hideElement(selectionRangeElement)
}

//

export function showDashedRange(range) {
  showElement(dashedRangeElement)
  setGridPosition(dashedRangeElement, range)
  setGridDimensions(dashedRangeElement, range)
}

export function hideDashedRange() {
  hideElement(dashedRangeElement)
}

//

export function showInputRange({ x, y }) {
  const range = { x, y, width: 0, height: 0 }
  inputRangeElement.style.display = 'flex'
  setGridPosition(inputRangeElement, range)
  setGridDimensions(inputRangeElement, range)

  // Move the text area so that IME can show up in the right place
  const rect = inputRangeElement.getBoundingClientRect()
  setPosition(textareaElement, rect)
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
  setGridDimensions(inputRangeElement, range)
}

export function hideInputRange() {
  hideElement(inputRangeElement)
  setGridDimensions(cursorElement, { width: 0, height: 0 })
}
