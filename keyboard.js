import {
  clearSelection,
  compositionStateChange,
  eraseBackward,
  eraseForward,
  insertText,
  moveCursor,
  moveCursorAndDisplace,
  moveCursorAndSelect,
  redo,
  selectAll,
  selectColumn,
  selectRow,
  undo,
} from './controller.js'
import { isKeyDown, keyDownTime } from './keyboard-global.js'

function doesCompleteCombo(key, comboKeys, delay = 200) {
  if (!comboKeys.includes(key)) return false
  return comboKeys
    .filter((k) => k !== key)
    .every((k) => isKeyDown(k) && keyDownTime(k) < delay)
}

const textarea = document.createElement('textarea')
textarea.tabIndex = -1
document.body.appendChild(textarea)

textarea.addEventListener('focus', (e) => console.log('focus textarea'))
textarea.addEventListener('blur', (e) => console.log('blur textarea'))

export function setValue(value) {
  textarea.value = value
}

export function focus() {
  textarea.focus({ preventScroll: true })
}

textarea.addEventListener('focus', () => {
  textarea.select()
})

textarea.addEventListener('compositionstart', (e) => {
  compositionStateChange('start', e.data)
})

textarea.addEventListener('compositionupdate', (e) => {
  compositionStateChange('update', e.data)
})

textarea.addEventListener('compositionend', (e) => {
  compositionStateChange('end', e.data)
})

textarea.addEventListener('input', (e) => {
  console.log('input', e.data, e.inputType)
  if (e.isComposing) return
  if (e.inputType === 'deleteContentBackward') return
  if (e.inputType === 'insertLineBreak') return
  // if (e.inputType === 'insertCompositionText') return
  // if (e.inputType === 'insertFromPaste') return

  insertText(e.data, e.inputType)
})

textarea.addEventListener('keydown', (e) => {
  console.log('keydown', e.key)

  if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()

    if (e.shiftKey) {
      redo()
    } else {
      undo()
    }

    return
  }

  if (e.ctrlKey && e.key.toLowerCase() === 'c') {
    copy()
    return
  }

  if (e.ctrlKey && e.key.toLowerCase() === 'x') {
    cut()
    return
  }

  if (e.key === 'Backspace') {
    eraseBackward(e.ctrlKey)
    return
  }

  if (e.key === 'Delete') {
    eraseForward(e.ctrlKey)
    return
  }
  if (e.shiftKey && doesCompleteCombo(e.key, ['ArrowUp', 'ArrowDown'])) {
    selectColumn()
    return
  }

  if (e.shiftKey && doesCompleteCombo(e.key, ['ArrowLeft', 'ArrowRight'])) {
    selectRow()
    return
  }

  if (e.ctrlKey && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    selectAll()
    return
  }

  if (e.key === 'Escape') {
    clearSelection()
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    // placeholder
    return
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    // placeholder
    return
  }

  if (e.key === 'Space') {
    e.preventDefault()
    // placeholder
    return
  }

  const arrowOffset = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  }[e.key]
  if (arrowOffset) {
    e.preventDefault()

    if (e.shiftKey) {
      moveCursorAndSelect(arrowOffset)
    } else if (e.altKey) {
      moveCursorAndDisplace(arrowOffset)
    } else {
      moveCursor(arrowOffset)
    }

    return
  }
})
