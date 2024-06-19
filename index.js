import * as History from './history.js'
import * as Grid from './grid.js'
import { Dom } from './dom.js'
import { Keyboard } from './keyboard.js'
import { Mouse } from './mouse.js'
import { cellSize } from './global.js'

const dom = Dom({
  root: document.body,
})

const grid = (() => {
  const maxRange = { x: 0, y: 0, dx: 0, dy: 0 }

  const read = dom.readCell
  const write = function ({ x, y }, value) {
    if (value) {
      maxRange.dx = Math.max(maxRange.dx, x)
      maxRange.dy = Math.max(maxRange.dy, y)
    }
    dom.writeCell({ x, y }, value)
  }

  return {
    read,
    write,
    readEntireGrid() {
      return Grid.readRange({ read }, maxRange)
    },
    empty() {
      Grid.deleteRange({ write }, maxRange)
    },
  }
})()

const cursor = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  set({ x, y, dx = 0, dy = 0 }) {
    cursor.x = x
    cursor.y = y
    cursor.dx = dx
    cursor.dy = dy
    dom.cursor.style.left = `${x * cellSize}px`
    dom.cursor.style.top = `${y * cellSize}px`
    dom.selectionRange.style.width = `${(Math.abs(dx) + 1) * cellSize}px`
    dom.selectionRange.style.height = `${(Math.abs(dy) + 1) * cellSize}px`
    dom.textarea.value = Grid.readRange(grid, cursor)
    setTimeout(() => {
      dom.textarea.focus()
      dom.textarea.select()
    }, 0)
  },
}

const history = (() => {
  function getState() {
    return {
      cursor: { ...cursor },
      text: grid.readEntireGrid(),
    }
  }

  function setState({ cursor: newCursor, text }) {
    cursor.set(newCursor)
    grid.empty()
    Grid.writeText(grid, { x: 0, y: 0 }, text)
  }

  const h = History.history()
  return {
    checkpoint: () => History.checkpoint(h, getState),
    undo: () => History.undo(h, getState, setState),
    redo: () => History.redo(h, getState, setState),
  }
})()

const mouse = Mouse({
  grid,
  history,
  cursor,
  containerElement: dom.grid,
  setDashedRange(range) {
    if (!range) {
      dom.dashedRange.style.display = 'none' 
      return
    }
    const { dx, dy } = range
    dom.dashedRange.style.display = 'block'
    dom.dashedRange.style.left = `${dx * cellSize}px`
    dom.dashedRange.style.top = `${dy * cellSize}px`
    dom.dashedRange.style.width = `${(Math.abs(cursor.dx) + 1) * cellSize}px`
    dom.dashedRange.style.height = `${(Math.abs(cursor.dy) + 1) * cellSize}px`
  },
})

const keyboard = Keyboard({ cursor, grid, dom, history })

///

history.checkpoint()

// Insert 20 random characters into the grid
for (let i = 0; i < 100; i++) {
  Grid.writeText(
    grid,
    {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
    },
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  )
}

addEventListener('focus', () => {
  cursor.set({ x: 10, y: 10 })
})
