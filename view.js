import { cellSize } from './global.js'
import * as Selection from './selection.js'
import * as Grid from './grid.js'
import * as Search from './search.js'
import * as BrowserZoom from './browser-zoom.js'
import { textareaElement } from './keyboard.js'
import * as Point from './point.js'
import { emitter } from './emitter.js'
import { clamp, debounce } from './util.js'
import { signal, computed, effect } from '@preact/signals-core'
import * as Pan from './pan.js'
import * as Config from './config.js'

function screenToCursor(screen) {
  const rect = originElement.getBoundingClientRect()
  const x = (screen.x - rect.left) / cellSize
  const y = (screen.y - rect.top) / cellSize
  const horizontal = Math.abs((x % 1) - 0.5) > Math.abs((y % 1) - 0.5)
  if (horizontal)
    return {
      horizontal,
      x: Math.round(x),
      y: Math.floor(y),
    }
  else
    return {
      horizontal,
      x: Math.floor(x),
      y: Math.round(y),
    }
}

export function screenToGridCell(screen) {
  const rect = originElement.getBoundingClientRect()
  const x = Math.floor((screen.x - rect.left) / cellSize)
  const y = Math.floor((screen.y - rect.top) / cellSize)
  return { x, y }
}

document.documentElement.style.setProperty('--cell-width', `${cellSize}px`)
document.documentElement.style.setProperty('--cell-height', `${cellSize}px`)

// document.body.classList.add('press-start-2p')
// document.body.classList.add('zen-maru-gothic')
// document.body.classList.add('inconsolata')
// document.body.classList.add('brush')
// document.body.classList.add('courier')
// document.body.classList.add('monaspace-radon')
// document.body.classList.add('azaret')
// document.body.classList.add('sometype')
// document.body.classList.add('iosevka-sans')

export const gridElement = document.createElement('div')
gridElement.className = 'grid'
gridElement.addEventListener('mousemove', (e) => {
  const rect = originElement.getBoundingClientRect()
  const x = (((e.clientX - rect.left) / cellSize) % 1) - 0.5
  const y = (((e.clientY - rect.top) / cellSize) % 1) - 0.5
  const isHorizontal = Math.abs(x) > Math.abs(y)
  gridElement.classList.toggle('horizontal', isHorizontal)
  gridElement.classList.toggle('vertical', !isHorizontal)
})
document.body.appendChild(gridElement)

export const $gridPixelDimensions = signal({ width: 0, height: 0 })
new ResizeObserver(() => {
  $gridPixelDimensions.value = {
    width: gridElement.offsetWidth,
    height: gridElement.offsetHeight,
  }
}).observe(gridElement)

const gridBackgroundElement = document.createElement('div')
gridBackgroundElement.innerHTML = `<svg width="100%" height="100%">
  <defs>
    <pattern patternUnits="userSpaceOnUse"
             id="gridPattern" 
             width="${cellSize}" 
             height="${cellSize}">
      <path d="M ${cellSize / 2} 0 L ${cellSize / 2} ${cellSize}
               M 0 ${cellSize / 2} L ${cellSize} ${cellSize / 2}
              "
            stroke="var(--grid-lines-color)" 
            stroke-width="${1}" 
           
            fill="none"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#gridPattern)" />
</svg>`
const gridPatternElement = gridBackgroundElement.querySelector('pattern')
effect(() => {
  const zoom = BrowserZoom.$zoom.value
  gridPatternElement.setAttribute(
    'shape-rendering',
    parseInt(zoom) === zoom ? 'crispEdges' : 'auto',
  )
})
effect(() => {
  const { x, y } = Pan.$offset.value
  gridPatternElement.setAttribute(
    'patternTransform',
    `translate(${x + cellSize / 2} ${y + cellSize / 2})`,
  )
})
gridBackgroundElement.className = 'gridBackground'
gridElement.appendChild(gridBackgroundElement)

const scrollBoxElement = document.createElement('div')
scrollBoxElement.className = 'scrollBox'
gridElement.appendChild(scrollBoxElement)

const originElement = document.createElement('div')
originElement.className = 'origin'
scrollBoxElement.appendChild(originElement)

//

const diamondElement = document.createElement('div')
diamondElement.className = 'diamond'
originElement.appendChild(diamondElement)

let lastDiamondPosition = { x: 0, y: 0 }
let diamondAnimation
addEventListener('mousemove', (e) => {
  if (diamondAnimation) {
    // diamondAnimation.cancel()
    // diamondAnimation = null
  }
  const rect = originElement.getBoundingClientRect()
  const position = {
    x: (e.clientX - rect.left) / cellSize,
    y: (e.clientY - rect.top) / cellSize,
  }
  const dx = (position.x % 1) - 0.5
  const dy = (position.y % 1) - 0.5

  const isHorizontal = Math.abs(dx) > Math.abs(dy)

  console.log(position, dx, dy)

  const diamondPosition = isHorizontal
    ? {
        x: Math.round(position.x),
        y: Math.floor(position.y) + 0.5,
      }
    : {
        x: Math.floor(position.x) + 0.5,
        y: Math.round(position.y),
      }

  if (
    diamondPosition.x !== lastDiamondPosition.x ||
    diamondPosition.y !== lastDiamondPosition.y
  ) {
    setGridPosition(diamondElement, diamondPosition)
    let m = 1.0
    diamondAnimation = diamondElement.animate(
      [
        { scale: isHorizontal ? '0 1' : '1 0' },
        { scale: isHorizontal ? `${m} 1` : `1 ${m}` },
      ],
      {
        duration: 240,
        fill: 'forwards',
        easing: 'cubic-bezier(0.6, 0, 0.8, 0)',
      },
    )
    diamondAnimation.addEventListener('finish', () => {
      // gridElement.classList.remove('diamond-cursor')
    })
  }

  lastDiamondPosition = diamondPosition
})

//

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
// originElement.appendChild(paragraphRangeElement)
Selection.$paragraphRange.subscribe((range) => {
  // console.log('paragraphRange', range)
  setGridPosition(paragraphRangeElement, range)
  setGridDimensions(paragraphRangeElement, range)
})

//

effect(() => {
  const selection = Selection.$selection.value
  const selectionRange = Selection.$selectionRange.value

  setGridPosition(cursorElement, selection.end)
  // setGridDimensions(cursorElement, { width: 0, height: 0 })

  setGridPosition(selectionRangeElement, selectionRange)
  setGridDimensions(selectionRangeElement, selectionRange)
})

//

const searchElement = document.createElement('div')
searchElement.className = 'search'
originElement.appendChild(searchElement)

effect(() => {
  const isOpen = Search.$isOpen.value
  const highlightedResult = Search.$highlightedResult.value
  gridElement.classList.toggle('searching', isOpen)
  searchElement.style.display = isOpen ? 'block' : 'none'
  selectionRangeElement.style.display =
    isOpen && !highlightedResult ? 'none' : 'block'
})

Search.$searchResults.subscribe((results) => {
  searchElement.innerHTML = ''
  for (const { x, y, width, height } of results) {
    const cell = document.createElement('div')
    cell.className = 'range searchResult'
    cell.style.translate = `${x * cellSize}px ${y * cellSize}px`
    cell.style.width = `${(width + 1) * cellSize}px`
    cell.style.height = `${(height + 1) * cellSize}px`
    searchElement.appendChild(cell)
  }
})

//

const menuElement = document.createElement('div')
menuElement.className = 'menu'
document.body.appendChild(menuElement)

const fontTypeElement = document.createElement('div')
fontTypeElement.className = 'item fontType'
const fontTypeSelectElement = document.createElement('select')
for (const [fontType, { displayName }] of Object.entries(Config.fontTypes)) {
  const fontTypeOptionElement = document.createElement('option')
  fontTypeOptionElement.value = fontType
  fontTypeOptionElement.textContent = displayName
  fontTypeSelectElement.appendChild(fontTypeOptionElement)
}
fontTypeSelectElement.addEventListener('change', (event) => {
  Config.$fontType.value = event.target.value
})
fontTypeElement.appendChild(fontTypeSelectElement)
const fontTypeDisplayElement = document.createElement('div')
fontTypeDisplayElement.className = 'displayCharacter fontTypeDisplay'
fontTypeDisplayElement.textContent = '字'
fontTypeElement.appendChild(fontTypeDisplayElement)
menuElement.appendChild(fontTypeElement)

effect(() => {
  const fontType = Config.$fontType.value
  for (const t of Object.keys(Config.fontTypes)) {
    document.body.classList.toggle(t, t === fontType)
  }
})

const languageElement = document.createElement('div')
languageElement.className = 'item language'
const languageSelectElement = document.createElement('select')
for (const [language, { displayName }] of Object.entries(Config.languages)) {
  const languageOptionElement = document.createElement('option')
  languageOptionElement.value = language
  languageOptionElement.textContent = displayName
  languageSelectElement.appendChild(languageOptionElement)
}
languageSelectElement.addEventListener('change', (event) => {
  Config.$language.value = event.target.value
})
languageElement.appendChild(languageSelectElement)
const languageDisplayElement = document.createElement('div')
languageDisplayElement.className = 'displayCharacter languageDisplay'
languageElement.appendChild(languageDisplayElement)
menuElement.appendChild(languageElement)

effect(() => {
  const language = Config.$language.value
  const languageDetails = Config.languages[language]
  for (const l of Object.keys(Config.languages)) {
    document.body.classList.toggle(l, l === language)
  }
  document.body.setAttribute('lang', languageDetails.lang)
  languageDisplayElement.textContent = languageDetails.displayCharacter
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
  el.style.width = `${(width + 1) * cellSize}px`
  el.style.height = `${(height + 1) * cellSize}px`
}

//

let didScroll = false
let scrollReference = { x: 0, y: 0 }

effect(() => {
  const panOffset = Pan.$offset.value
  const contentRange = Selection.$contentRange.value
  const gridPixelDimensions = $gridPixelDimensions.value
  // console.log(panOffset, contentRange, gridPixelDimensions)

  if (panOffset.fromScrollEvent) return

  // console.log('panOffset maybe changed,', panOffset)
  setPosition(originElement, panOffset)

  const scroll = Point.round(
    Point.scale(Point.add(panOffset, Point.scale(contentRange, cellSize)), -1),
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
})

scrollBoxElement.addEventListener('scroll', (e) => {
  if (didScroll) {
    didScroll = false
    return
  }
  const { scrollLeft, scrollTop } = e.target

  const scroll = { x: scrollLeft, y: scrollTop }

  const newPanOffset = Point.sub(Point.scale(scroll, -1), scrollReference)

  // console.log('scroll event', scrollLeft, scrollTop, '=>', newPanOffset)

  Pan.$offset.value = { ...newPanOffset, fromScrollEvent: true }
  // TODO: this doesn't work idk why
  Pan.stop()
})

//

function setCellValue(el, value) {
  el.textContent = value
  // if(value.charCodeAt(0) < 1000) el.style.fontSize = '1.5em'
  // if (value.charCodeAt(0) < 1000) el.style.fontSize = '1.5em'
  // else el.style.fontSize = '1em'
  // el.classList.toggle('wide', isFullWidth(value))
}

Grid.onCellCreated(({ id, value, position }) => {
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
Grid.onCellRestored(({ id, value, position }) => {
  const el = cellIdToElementMap.get(id)

  if (!el.isConnected) {
    cellsElement.appendChild(el)
  }

  setCellValue(el, value)
  setGridPosition(el, position)
})

Grid.onCellUpdated(({ id, value }) => {
  const el = cellIdToElementMap.get(id)
  setCellValue(el, value)
})

Grid.onCellMoved(({ id, position }) => {
  const el = cellIdToElementMap.get(id)
  setGridPosition(el, position)
})

Grid.onCellRemoved(({ id }) => {
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
  // setGridDimensions(cursorElement, { width: 0, height: 0 })
}
