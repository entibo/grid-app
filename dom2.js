import { cellSize } from './global.js'

function createCell({ x, y }) {
  const cell = document.createElement('div')
  cell.className = 'cell'
  cell.dataset.x = x
  cell.dataset.y = y
  cell.style.translate = `${x * cellSize}px ${y * cellSize}px`
  return cell
}

export function getCellFromMouseEvent(e) {
  // One could alternatively use the event x,y
  const cell = e.target
  if (!cell.classList.contains('cell')) return
  return { x: parseInt(cell.dataset.x), y: parseInt(cell.dataset.y) }
}

export function Dom({ root }) {
  const grid = document.createElement('div')
  grid.className = 'grid'
  grid.style.setProperty('--cell-size', `${cellSize}px`)
  root.appendChild(grid)

  const cells = document.createElement('div')
  cells.className = 'cells'
  grid.appendChild(cells)

  const cursor = document.createElement('div')
  cursor.className = 'cursor'
  grid.appendChild(cursor)

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

  function getCell({ x, y }) {
    return cells.querySelector(`[data-x="${x}"][data-y="${y}"]`)
  }

  function readCell({ x, y }) {
    return getCell({ x, y })?.textContent ?? ''
  }

  function writeCell({ x, y }, value) {
    console.log('dom  write', x, y, value)
    let cell = getCell({ x, y })
    if (!cell) {
      cell = createCell({ x, y })
      cells.appendChild(cell)
    }
    cell.textContent = value
  }

  return {
    grid,
    cursor,
    selectionRange,
    dashedRange,
    inputRange,
    textarea,
    readCell,
    writeCell,
    getCellFromMouseEvent,
  }
}
