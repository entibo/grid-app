import { cellSize } from './global.js'
import { $textarea } from './keyboard.js'
import { scaleValue } from './pan.js'
import * as Point from './point.js'
import { debounce } from './util.js'

export function screenToGrid(screen) {
  const rect = $origin.getBoundingClientRect()
  const x = Math.floor((screen.x - rect.left) / cellSize)
  const y = Math.floor((screen.y - rect.top) / cellSize)
  return Point.scale({ x, y }, 1 / scaleValue)
}

const $grid = document.createElement('div')
$grid.className = 'grid'
$grid.style.setProperty('--cell-size', `${cellSize}px`)
document.body.appendChild($grid)

const $zoomBox = document.createElement('div')
$zoomBox.className = 'zoomBox'
$grid.appendChild($zoomBox)

const $gridBackground = document.createElement('div')
$gridBackground.innerHTML = `<svg width="100%" height="100%">
  <defs>
    <pattern id="grid" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse">
      <path d="M ${cellSize} 0 L 0 0 0 ${cellSize}"
            stroke="var(--grid-color)" 
            stroke-width="1" 
            fill="none"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />
</svg>`
$gridBackground.className = 'gridBackground'
$zoomBox.appendChild($gridBackground)

const $origin = document.createElement('div')
$origin.className = 'origin'
$zoomBox.appendChild($origin)

const $cells = document.createElement('div')
$cells.className = 'cells'
$origin.appendChild($cells)

const $largeCells = document.createElement('div')
$largeCells.className = 'cells largeCells'
$origin.appendChild($largeCells)

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

function setDimensions($, { dx, dy }) {
  $.style.width = `${(dx + 1) * cellSize}px`
  $.style.height = `${(dy + 1) * cellSize}px`
}

//

export function showPanOffset({ x, y }) {
  setPosition($gridBackground, { x: x % cellSize, y: y % cellSize })
  setPosition($origin, { x, y })
}

export function setZoom(zoom) {
  $zoomBox.style.transform = `scale(${zoom})`
}

//

export function cellCreated({ id, value, position }) {
  const $cell = document.createElement('div')
  $cell.className = 'cell'
  $cells.appendChild($cell)

  setGridPosition($cell, position)
  $cell.textContent = value

  cellIdToElementMap.set(id, $cell)
}

// Same as cellCreated, except we are
// guaranteed that cellCreated was called
// with this id in the past
export function cellRestored({ id, value, position }) {
  const $cell = cellIdToElementMap.get(id)
  if (!$cell.isConnected) {
    $cells.appendChild($cell)
  }

  setGridPosition($cell, position)
  $cell.textContent = value
}

export function cellUpdated({ id, value }) {
  const $cell = cellIdToElementMap.get(id)
  $cell.textContent = value
}

export function cellMoved({ id, position }) {
  const $cell = cellIdToElementMap.get(id)
  setGridPosition($cell, position)
}

export function cellRemoved({ id }) {
  const $cell = cellIdToElementMap.get(id)
  $cell.remove()
  // cellIdToElementMap.delete(id)
}

//

export function displayLargeCells(scaledPositionedValues) {
  $largeCells.innerHTML = ''
  for (const { scale, position, value } of scaledPositionedValues) {
    const $cell = document.createElement('div')
    $cell.className = 'cell largeCell'
    $cell.textContent = value
    $largeCells.appendChild($cell)
    setGridPosition($cell, position)
    $cell.style.scale = scale
  }
}

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

export function showInputRange({ x, y }, scale) {
  const range = { x, y, dx: 0, dy: 0 }
  $inputRange.style.display = 'flex'
  $inputRange.style.scale = scale
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
    dx: compositionText.length - 1,
    dy: 0,
  }
  $inputRange.style.display = 'flex'
  setGridPosition($inputRange, range)
  setDimensions($inputRange, range)
}

export function hideInputRange() {
  hideElement($inputRange)
  setDimensions($cursor, { dx: 0, dy: 0 })
}
