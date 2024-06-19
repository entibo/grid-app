import { cellSize } from './global.js'

function createCell({ x, y }) {
  const cell = document.createElement('div')
  cell.className = 'cell'
  cell.dataset.x = x
  cell.dataset.y = y
  return cell
}

function createRow(y, numColumns) {
  const row = document.createElement('div')
  row.className = 'row'
  for (let x = 0; x < numColumns; x++) {
    const cell = createCell({ x, y })
    row.appendChild(cell)
  }
  return row
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

  const rows = document.createElement('div')
  rows.className = 'rows'
  grid.appendChild(rows)
  for (let y = 0; y < 100; y++) {
    const row = createRow(y, 100)
    rows.appendChild(row)
  }

  const cursor = document.createElement('div')
  cursor.className = 'cursor'
  grid.appendChild(cursor)

  const selectionRange = document.createElement('div')
  selectionRange.className = 'range selectionRange'
  cursor.appendChild(selectionRange)

  const dashedRange = document.createElement('div')
  dashedRange.className = 'range dashedRange'
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

  function getNumRoms() {
    return rows.children.length
  }
  function getNumColumns() {
    return rows.children[0]?.children.length ?? 0
  }

  function readCell({ x, y }) {
    return rows.children[y]?.children[x]?.textContent ?? ''
  }

  function writeCell({ x, y }, value) {
    console.log('write', x, y, value)
    for (let newY = rows.children.length; newY <= y; newY++) {
      rows.appendChild(createRow(newY, getNumColumns()))
    }
    for (let newX = rows.children[y].children.length; newX <= x; newX++) {
      for (let y = 0; y < rows.children.length; y++) {
        rows.children[y].appendChild(createCell({ x: newX, y: y }))
      }
    }
    rows.children[y].children[x].textContent = value
  }

  return {
    grid,
    rows,
    cursor,
    selectionRange,
    dashedRange,
    inputRange,
    textarea,
    getNumColumns,
    readCell,
    writeCell,
    getCellFromMouseEvent,
  }
}
