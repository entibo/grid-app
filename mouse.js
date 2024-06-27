import { getCellFromMouseEvent } from './dom.js'
import {
  deleteRange,
  getPositionDelta,
  isWithinRange,
  readRange,
  writeRange,
  writeText,
} from './old/grid.js'
import { listenToKeyStateChange } from './keyboard-global.js'

function setPointerType(type = 'auto') {
  // grid.style.cursor = type
}

export function Mouse({
  containerElement,
  setDashedRange,
  grid,
  cursor,
  history: { checkpoint },
}) {
  let currentPosition = null
  let startPosition = null
  let mode = null

  containerElement.addEventListener('pointerdown', start)
  containerElement.addEventListener('pointermove', update)
  addEventListener('blur', stop)
  addEventListener('pointerup', stop)
  containerElement.addEventListener('pointerleave', stop)

  listenToKeyStateChange('Alt', (down) => {
    if (down && startPosition && currentPosition) {
      startPosition = currentPosition
      mode = 'move'
      setDashedRange({ dx: 0, dy: 0 })
    }
  })

  function start(e) {
    if (e.button !== 0) return

    currentPosition = startPosition = getCellFromMouseEvent(e)
    if (!startPosition) return

    if (isWithinRange(startPosition, cursor)) {
      mode = 'move'
      setDashedRange({ dx: 0, dy: 0 })
    } else {
      mode = 'select'
      cursor.set(startPosition)
    }
  }

  function update(e) {
    currentPosition = getCellFromMouseEvent(e)
    if (!currentPosition) return

    if (startPosition) {
      const { dx, dy } = getPositionDelta(startPosition, currentPosition)
      if (mode === 'select') {
        const range = { ...startPosition, dx, dy }
        // if (dx < 0) range.x += dx
        // if (dy < 0) range.y += dy
        cursor.set(range)
      } else if (mode === 'move') {
        setDashedRange({ dx, dy })
      }
    }
  }

  function stop() {
    if (!startPosition) return
    if (!currentPosition) return
    console.log('stop')
    const { dx, dy } = getPositionDelta(startPosition, currentPosition)
    if (mode === 'move') {
      checkpoint()
      const content = readRange(grid, cursor)
      deleteRange(grid, cursor)
      cursor.set({
        ...cursor.positive,
        x: cursor.positive.x + dx,
        y: cursor.positive.y + dy,
      })
      writeText(grid, cursor, content)
    }
    startPosition = null
    setDashedRange(null)
  }
}
