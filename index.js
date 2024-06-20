import * as History from './history.js'
import * as Grid from './grid.js'
import { Dom } from './dom.js'
import { Keyboard } from './grid.js'
import { Mouse } from './mouse.js'
import { cellSize } from './global.js'
import { debounce } from './util.js'
import { readHash, writeHash } from './storage.js'

const dom = Dom({
  root: document.body,
})

const grid = (() => {
  const maxRange = { x: 0, y: 0, dx: 0, dy: 0 }

  const read = function ({ x, y }) {
    const value = dom.readCell({ x, y })
    return value
  }

  const debouncedWriteHash = debounce(() => {
    writeHash(Grid.trimText(grid.readEntireGrid()))
  }, 500)

  const write = function ({ x, y }, value) {
    if (value) {
      if (x > maxRange.dx) {
        console.log('increasing maxRange.x', x)
      }
      if (y > maxRange.dy) {
        console.log('increasing maxRange.y', y)
      }
      maxRange.dx = Math.max(maxRange.dx, x)
      maxRange.dy = Math.max(maxRange.dy, y)
      debouncedWriteHash()
    }
    console.log('write', x, y, value)
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
  positive: { x: 0, y: 0, dx: 0, dy: 0 },
  set({ x, y, dx = 0, dy = 0 }) {
    cursor.positive = Grid.positiveRange({ x, y, dx, dy })
    console.log('cursor', x, y, dx, dy)
    cursor.x = x
    cursor.y = y
    cursor.dx = dx
    cursor.dy = dy
    dom.cursor.style.left = `${x * cellSize}px`
    dom.cursor.style.top = `${y * cellSize}px`
    dom.selectionRange.style.left = `${(cursor.positive.x - x) * cellSize}px`
    dom.selectionRange.style.top = `${(cursor.positive.y - y) * cellSize}px`
    dom.selectionRange.style.width = `${(cursor.positive.dx + 1) * cellSize}px`
    dom.selectionRange.style.height = `${(cursor.positive.dy + 1) * cellSize}px`
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
    dom.dashedRange.style.left = `${
      (cursor.positive.x - cursor.x + dx) * cellSize
    }px`
    dom.dashedRange.style.top = `${
      (cursor.positive.y - cursor.y + dy) * cellSize
    }px`
    dom.dashedRange.style.width = `${(Math.abs(cursor.dx) + 1) * cellSize}px`
    dom.dashedRange.style.height = `${(Math.abs(cursor.dy) + 1) * cellSize}px`
  },
})

const keyboard = Keyboard({ cursor, grid, dom, history })

/// init

const initText = await readHash()
Grid.writeText(grid, { x: 0, y: 0 }, initText)

function writeSample() {
  history.checkpoint()
  Grid.writeText(grid, { x: 0, y: 0 }, 'Hello, World!')

  // Insert 20 random characters into the grid
  for (let i = 0; i < 10; i++) {
    Grid.writeText(
      grid,
      {
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
      },
      String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    )
  }

  addEventListener('focus', () => {
    cursor.set({ x: 10, y: 10 })
  })
}
