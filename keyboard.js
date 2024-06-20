import { cellSize } from './global.js'
import { deleteRange, moveRange, nextPosition, writeText } from './grid.js'
import { isKeyDown, keyDownTime } from './keyboard-global.js'

export function Keyboard({
  cursor,
  grid,
  dom,
  history: { checkpoint, undo, redo },
}) {
  function onCompositionUpdate(e) {
    for (const cell of dom.inputRange.children) {
      cell.style.display = 'none'
    }
    for (let i = 0; i < e.data.length; i++) {
      const cell = dom.inputRange.children[i]
      cell.textContent = e.data[i]
      cell.style.display = 'flex'
    }
    dom.inputRange.style.left = `${cursor.dx * cellSize}px`
    dom.inputRange.style.top = `${cursor.dy * cellSize}px`
    dom.inputRange.style.width = `${e.data.length * cellSize + 1}px`
    // dom.inputRange.style.height = `${e.data.length * cellSize + 1}px`
  }
  dom.textarea.addEventListener('compositionstart', (e) => {
    console.log('compositionstart')
    dom.inputRange.classList.add('composing')
    onCompositionUpdate(e)
  })
  dom.textarea.addEventListener('compositionupdate', (e) => {
    console.log('compositionupdate', e.data)
    onCompositionUpdate(e)
  })
  dom.textarea.addEventListener('compositionend', (e) => {
    console.log('compositionend', e.data)
    for (const cell of dom.inputRange.children) {
      cell.style.display = 'none'
    }
    dom.inputRange.classList.remove('composing')
    dom.inputRange.style = ''
    if (e.data.length === 0) return
    checkpoint()
    deleteRange(grid, cursor)
    const range = writeText(grid, cursor, e.data)
    console.log('wrote composition', cursor, range, e.data)
    cursor.set(nextPosition({ x: range.x + range.dx, y: range.y + range.dy }))
  })

  dom.textarea.addEventListener('input', (e) => {
    console.log(e.inputType, e.data)
    if (e.isComposing) return
    if (e.inputType === 'deleteContentBackward') return
    if (e.inputType === 'insertCompositionText') return
    if (e.inputType === 'insertFromPaste') {
      checkpoint()
      deleteRange(grid, cursor)
      const range = writeText(grid, cursor, e.data)
      cursor.set(range)
      return
    }
    if (e.data.length === 0) return
    checkpoint()
    deleteRange(grid, cursor)
    const range = writeText(grid, cursor, e.data)
    if (!range) return
    cursor.set(nextPosition({ x: range.x + range.dx, y: range.y + range.dy }))
  })

  dom.textarea.addEventListener('keydown', (e) => {
    console.log('keydown', e.key)

    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
    }

    const copyAction = {
      c: 'copy',
      x: 'cut',
    }[e.ctrlKey && e.key.toLowerCase()]

    if (copyAction) {
      // e.preventDefault()
      // const text = serializeRange(cursor)
      if (copyAction === 'cut') {
        checkpoint()
        deleteRange(grid, cursor)
      }
      // Copy selection into clipboard
      // console.log(copyAction, text)
      // navigator.clipboard.writeText(text)
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      return
    }

    function together(keys, delay = 200) {
      const current = keys.find((k) => e.key === k)
      if (!current) return false
      return keys
        .filter((k) => k !== current)
        .every((k) => isKeyDown(k) && keyDownTime(k) < delay)
    }

    if (e.shiftKey && together(['ArrowUp', 'ArrowDown'])) {
      cursor.set({
        x: cursor.x,
        y: 0,
        dx: cursor.dx,
        dy: 10,
      })
      return
    }

    if (e.shiftKey && together(['ArrowLeft', 'ArrowRight'])) {
      cursor.set({
        x: 0,
        y: cursor.y,
        dx: 10,
        dy: cursor.dy,
      })
      return
    }

    const arrowMotion = {
      ArrowUp: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 },
      ArrowLeft: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
    }[e.key]
    if (arrowMotion) {
      if (e.shiftKey) {
        cursor.set({
          ...cursor,
          dx: cursor.dx + arrowMotion.dx,
          dy: cursor.dy + arrowMotion.dy,
        })
        return
      }

      if (e.altKey) {
        e.preventDefault()
        checkpoint()
        moveRange(grid, cursor, arrowMotion)
        cursor.set({
          x: cursor.x + arrowMotion.dx,
          y: cursor.y + arrowMotion.dy,
          dx: cursor.dx,
          dy: cursor.dy,
        })
        console.log('moving', arrowMotion)
        return
      }

      // Only move cursor

      cursor.set({
        x:
          cursor.x +
          arrowMotion.dx +
          (Math.sign(cursor.dx) === Math.sign(arrowMotion.dx) ? cursor.dx : 0),
        y:
          cursor.y +
          arrowMotion.dy +
          (Math.sign(cursor.dy) === Math.sign(arrowMotion.dy) ? cursor.dy : 0),
        dx: 0,
        dy: 0,
      })
    }

    if (e.key === 'Escape') {
      cursor.set({ ...cursor, dx: 0, dy: 0 })
    }

    if (e.key === 'Backspace') {
      checkpoint()
      deleteRange(grid, cursor)
      cursor.set({ x: cursor.x - 1, y: cursor.y })
    }
    if (e.key === 'Delete') {
      checkpoint()
      deleteRange(grid, cursor)
      cursor.set({ x: cursor.x + cursor.dx + 1, y: cursor.y })
    }
  })
}
