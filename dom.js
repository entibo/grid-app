import { cellSize } from './global.js'
import { debounce } from './util.js'

export function getGridPositionFromMouseEvent(e) {
  // todo: position relative to origin
  // use e.clientX and e.clientY
  return { x, y }
}

const grid = document.createElement('div')
grid.className = 'grid'
grid.style.setProperty('--cell-size', `${cellSize}px`)
document.body.appendChild(grid)

const origin = document.createElement('div')
origin.className = 'origin'
grid.appendChild(origin)

{
  const padder = document.createElement('div')
  padder.className = ''
  grid.appendChild(padder)

  const scrollPadding = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  }

  function setPadding(amount) {
    const diff = amount - scrollPadding.top
    scrollPadding.top = amount
    grid.scrollTop += diff
    origin.style.paddingTop = `${scrollPadding.top}px`
  }
  const setPaddingDebounced = debounce(setPadding, 100)

  const scrollPaddingIncrement = 400
  grid.addEventListener('scroll', () => {
    const targetScrollPadingTop =
      Math.max(
        0,

        Math.floor(
          1 + (scrollPadding.top - grid.scrollTop) / scrollPaddingIncrement,
        ),
      ) * scrollPaddingIncrement
    console.log(
      'grid.scrollTop:',
      grid.scrollTop,
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

const cells = document.createElement('div')
cells.className = 'cells'
origin.appendChild(cells)

const cursor = document.createElement('div')
cursor.className = 'cursor'
origin.appendChild(cursor)

const selectionRange = document.createElement('div')
selectionRange.className = 'range selectionRange'
cursor.appendChild(selectionRange)

const dashedRange = document.createElement('div')
dashedRange.className = 'range dashedRange'
dashedRange.style.display = 'none'
cursor.appendChild(dashedRange)

const inputRange = document.createElement('div')
inputRange.className = 'range inputRange'
for (let x = 0; x < 20; x++) {
  cursor.appendChild(inputRange)
  // Fake cells to display user input
  const cell = document.createElement('div')
  cell.className = 'cell'
  cell.style.display = 'none'
  inputRange.appendChild(cell)
}

const textarea = document.createElement('textarea')
textarea.className = 'textarea'
textarea.tabIndex = -1
grid.appendChild(textarea)

export function hideInputRange() {
  dom.inputRange.classList.remove('composing')
  for (const cell of dom.inputRange.children) {
    cell.style.display = 'none'
  }
  dom.inputRange.style.width = ''
}

export function showInputRange() {
  dom.inputRange.classList.add('composing')
}

export function updateInputRange(compositionText) {
  for (const cell of dom.inputRange.children) {
    cell.style.display = 'none'
  }
  for (let i = 0; i < compositionText.length; i++) {
    const cell = dom.inputRange.children[i]
    cell.textContent = compositionText[i]
    cell.style.display = 'flex'
  }
  dom.inputRange.style.left = `${cursor.dx * cellSize}px`
  dom.inputRange.style.top = `${cursor.dy * cellSize}px`
  dom.inputRange.style.width = `${compositionText.length * cellSize + 1}px`
  // dom.inputRange.style.height = `${text.length * cellSize + 1}px`
}

//
//
//
// recycling bin
//

function createCell({ x, y }) {
  const cell = document.createElement('div')
  cell.className = 'cell'
  cell.dataset.x = x
  cell.dataset.y = y
  cell.style.translate = `${x * cellSize}px ${y * cellSize}px`
  return cell
}

function handleDeltaCell({ cell, created, updated, moved, removed }) {
  if (created) {
    cell.element = document.createElement('div')
    cell.element.className = 'cell'
    dom.cells.appendChild(cell.element)
  }
  if (updated) {
    cell.element.textContent = cell.value
  }
  if (moved) {
    cell.element.style.translate = [
      cell.position.x * cellSize,
      cell.position.y * cellSize,
    ]
      .map((s) => s + 'px')
      .join(' ')
  }
  if (removed) {
    cell.element.remove()
  }
}

function restoreCellsOrWhatever() {
  const oldCells = grid.cells
  grid.cells = cells
  for (const cell of cells) {
    if (!cell.element.isConnected) {
      dom.cells.appendChild(cell.element)
    }
    cell.element.textContent = cell.value
    cell.style.translate = [
      cell.position.x * cellSize,
      cell.position.y * cellSize,
    ]
      .map((s) => s + 'px')
      .join(' ')

    cell.dataset.stateId = stateId
  }

  for (const oldCell of oldCells) {
    if (oldCell.element.dataset.stateId != stateId) {
      oldCell.element.remove()
    }
  }
}
