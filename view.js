import { cellSize } from './global.js'
import { debounce } from './util.js'

export function screenToGrid(e) {
  const rect = $origin.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left) / cellSize)
  const y = Math.floor((e.clientY - rect.top) / cellSize)
  return { x, y }
}

const $grid = document.createElement('div')
$grid.className = 'grid'
$grid.style.setProperty('--cell-size', `${cellSize}px`)
document.body.appendChild($grid)

const $origin = document.createElement('div')
$origin.className = 'origin'
$grid.appendChild($origin)

{
  const $padder = document.createElement('div')
  $padder.className = ''
  $grid.appendChild($padder)

  const scrollPadding = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  }

  function setPadding(amount) {
    const diff = amount - scrollPadding.top
    scrollPadding.top = amount
    $grid.scrollTop += diff
    $origin.style.paddingTop = `${scrollPadding.top}px`
  }
  const setPaddingDebounced = debounce(setPadding, 100)

  const scrollPaddingIncrement = 400
  $grid.addEventListener('scroll', () => {
    const targetScrollPadingTop =
      Math.max(
        0,

        Math.floor(
          1 + (scrollPadding.top - $grid.scrollTop) / scrollPaddingIncrement,
        ),
      ) * scrollPaddingIncrement
    console.log(
      'grid.scrollTop:',
      $grid.scrollTop,
      'padding:',
      scrollPadding.top,
    )
    console.log('targetScrollPadingTop:', targetScrollPadingTop)
    if (targetScrollPadingTop !== scrollPadding.top) {
      const diff = targetScrollPadingTop - scrollPadding.top
      if (diff < 0) {
        setPaddingDebounced(targetScrollPadingTop)
      } else {
        setPadding(targetScrollPadingTop)
      }
    }
  })
}

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
for (let x = 0; x < 20; x++) {
  $origin.appendChild($inputRange)
  // Fake cells to display user input
  const cell = document.createElement('div')
  cell.className = 'cell'
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
  $.style.translate = `${x * cellSize}px ${y * cellSize}px`
}

function setDimensions($, { dx, dy }) {
  $.style.width = `${(dx + 1) * cellSize}px`
  $.style.height = `${(dy + 1) * cellSize}px`
}

//

export function cellCreated({ id, value, position }) {
  const $cell = document.createElement('div')
  $cell.className = 'cell'
  $cells.appendChild($cell)

  setPosition($cell, position)
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

  setPosition($cell, position)
  $cell.textContent = value
}

export function cellUpdated({ id, value }) {
  const $cell = cellIdToElementMap.get(id)
  $cell.textContent = value
}

export function cellMoved({ id, position }) {
  const $cell = cellIdToElementMap.get(id)
  setPosition($cell, position)
}

export function cellRemoved({ id }) {
  const $cell = cellIdToElementMap.get(id)
  $cell.remove()
  // cellIdToElementMap.delete(id)
}

//

//

export function showCursor(position) {
  showElement($cursor)
  setPosition($cursor, position)
}

export function hideCursor() {
  hideElement($cursor)
}

//

export function showSelectionRange(range) {
  showElement($selectionRange)
  setPosition($selectionRange, range)
  setDimensions($selectionRange, range)
}

export function hideSelectionRange() {
  hideElement($selectionRange)
}

//

export function showDashedRange(range) {
  showElement($dashedRange)
  setPosition($dashedRange, range)
  setDimensions($dashedRange, range)
}

export function hideDashedRange() {
  hideElement($dashedRange)
}

//

export function showInputRange() {
  dom.inputRange.classList.add('composing')
}

export function updateInputRange(compositionText) {
  for (const cell of dom.inputRange.children) {
    hideElement(cell)
  }
  for (let i = 0; i < compositionText.length; i++) {
    const cell = dom.inputRange.children[i]
    cell.textContent = compositionText[i]
    cell.style.display = 'flex'
  }

  const range = {
    x: 0,
    y: 0,
    dx: compositionText.length,
    dy: 0,
  }
  showElement(dom.inputRange)
  setPosition(dom.inputRange, range)
  setDimensions(dom.inputRange, range)
}

export function hideInputRange() {
  dom.inputRange.classList.remove('composing')
  for (const cell of dom.inputRange.children) {
    hideElement(cell)
  }
  dom.inputRange.style.width = ''
}
