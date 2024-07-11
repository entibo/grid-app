import { cellSize } from './global.js'
import {
  $cellCreated,
  $cellMoved,
  $cellRemoved,
  $cellRestored,
  $cellUpdated,
} from './grid.js'
import { $textarea } from './keyboard.js'
import * as Point from './point.js'
import { signal } from './signal.js'
import { debounce } from './util.js'

export function screenToGrid(screen) {
  const rect = $origin.getBoundingClientRect()
  const x = Math.floor((screen.x - rect.left) / cellSize)
  const y = Math.floor((screen.y - rect.top) / cellSize)
  return { x, y }
}

export const $grid = document.createElement('div')
$grid.className = 'grid'
$grid.style.setProperty('--cell-size', `${cellSize}px`)
document.body.appendChild($grid)

export const $gridPixelDimensions = signal({ width: 0, height: 0 })
new ResizeObserver(() => {
  $gridPixelDimensions.set({
    width: $grid.offsetWidth,
    height: $grid.offsetHeight,
  })
}).observe($grid)

const $gridBackground = document.createElement('div')
$gridBackground.innerHTML = `<svg width="100%" height="100%">
  <defs>
    <pattern id="gridPattern" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse">
      <path d="M ${cellSize} 0 L 0 0 0 ${cellSize}"
            stroke="var(--grid-color)" 
            stroke-width="1" 
            fill="none"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#gridPattern)" />
  </svg>`
const $gridSVGPattern = $gridBackground.querySelector('pattern')
// onPanChanged(({ x, y }) => {
//   $gridSVGPattern.setAttribute(
//     'patternTransform',
//     `translate(${x % cellSize} ${y % cellSize})`,
//   )
// })
$gridBackground.className = 'gridBackground'
$grid.appendChild($gridBackground)

const $origin = document.createElement('div')
$origin.className = 'origin'
$grid.appendChild($origin)

const $cells = document.createElement('div')
$cells.className = 'cells'
$origin.appendChild($cells)

const $cursor = document.createElement('div')
$cursor.className = 'cursor'
$origin.appendChild($cursor)

const $selectionRange = document.createElement('div')
$selectionRange.className = 'range selectionRange'
$origin.appendChild($selectionRange)

const $dashedRange = document.createElement('div')
$dashedRange.className = 'range dashedRange'
$dashedRange.style.display = 'none'
$origin.appendChild($dashedRange)

const $inputRange = document.createElement('div')
$inputRange.className = 'range inputRange'
for (let x = 0; x < 30; x++) {
  $origin.appendChild($inputRange)
  // Fake cells to display user input
  const cell = document.createElement('div')
  cell.className = 'cell preview'
  cell.style.display = 'none'
  $inputRange.appendChild(cell)
}

//

const cellIdToElementMap = new Map()

setInterval(() => {
  console.log('cellIdToElementMap.size:', cellIdToElementMap.size)
}, 10000)

//

function showElement($) {
  $.style.display = 'block'
}

function hideElement($) {
  $.style.display = 'none'
}

function setPosition($, { x, y }) {
  $.style.translate = `${x}px ${y}px`
}

function setGridPosition($, point) {
  setPosition($, Point.scale(point, cellSize))
}

function setDimensions($, { width, height }) {
  $.style.width = `${(width + 1) * cellSize}px`
  $.style.height = `${(height + 1) * cellSize}px`
}

//

export function showPanOffset({ x, y }) {
  // console.log({
  //   x: -x,
  //   y: -y,
  //   width: $grid.clientWidth,
  //   height: $grid.clientHeight,
  // })
  // console.log('setting origin transform,', x, y)

  setPosition($gridBackground, { x: x % cellSize, y: y % cellSize })
  setPosition($origin, { x, y })
}

//

$cellCreated.subscribe(({ id, value, position }) => {
  const $cell = document.createElement('div')
  $cell.className = 'cell'
  $cells.appendChild($cell)

  setGridPosition($cell, position)
  $cell.textContent = value

  cellIdToElementMap.set(id, $cell)
})

// Same as cellCreated, except we are
// guaranteed that cellCreated was called
// with this id in the past
$cellRestored.subscribe(({ id, value, position }) => {
  const $cell = cellIdToElementMap.get(id)
  if (!$cell.isConnected) {
    $cells.appendChild($cell)
  }

  setGridPosition($cell, position)
  $cell.textContent = value
})

$cellUpdated.subscribe(({ id, value }) => {
  const $cell = cellIdToElementMap.get(id)
  $cell.textContent = value
})

$cellMoved.subscribe(({ id, position }) => {
  const $cell = cellIdToElementMap.get(id)
  setGridPosition($cell, position)
})

$cellRemoved.subscribe(({ id }) => {
  const $cell = cellIdToElementMap.get(id)
  $cell.remove()
  // cellIdToElementMap.delete(id)
})

//

export function showCursor(position) {
  showElement($cursor)
  setGridPosition($cursor, position)
}

export function hideCursor() {
  hideElement($cursor)
}

//

export function showSelectionRange(range) {
  showElement($selectionRange)
  setGridPosition($selectionRange, range)
  setDimensions($selectionRange, range)
}

export function hideSelectionRange() {
  hideElement($selectionRange)
}

//

export function showDashedRange(range) {
  showElement($dashedRange)
  setGridPosition($dashedRange, range)
  setDimensions($dashedRange, range)
}

export function hideDashedRange() {
  hideElement($dashedRange)
}

//

export function showInputRange({ x, y }) {
  const range = { x, y, width: 0, height: 0 }
  $inputRange.style.display = 'flex'
  setGridPosition($inputRange, range)
  setDimensions($inputRange, range)

  // Move the text area so that IME can show up in the right place
  const rect = $inputRange.getBoundingClientRect()
  setPosition($textarea, rect)
}

export function updateInputRange({ x, y }, compositionText) {
  for (const cell of $inputRange.children) {
    hideElement(cell)
  }
  for (let i = 0; i < compositionText.length; i++) {
    const cell = $inputRange.children[i]
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
  $inputRange.style.display = 'flex'
  setGridPosition($inputRange, range)
  setDimensions($inputRange, range)
}

export function hideInputRange() {
  hideElement($inputRange)
  setDimensions($cursor, { width: 0, height: 0 })
}
