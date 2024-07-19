import {
  clearSelection,
  compositionStateChange,
  copy,
  cut,
  eraseBackward,
  eraseForward,
  insertText,
  moveCursor,
  moveCursorAndDisplace,
  moveCursorAndSelect,
  moveToNextCell,
  moveToNextLine,
  redo,
  selectAll,
  selectColumn,
  selectRow,
  undo,
} from './index.js'
import { isKeyDown, keyDownTime } from './keyboard-global.js'

function space() {
  moveToNextCell()
}

function doesCompleteCombo(key, comboKeys, delay = 200) {
  if (!comboKeys.includes(key)) return false
  return comboKeys
    .filter((k) => k !== key)
    .every((k) => isKeyDown(k) && keyDownTime(k) < delay)
}

export const textareaElement = document.createElement('textarea')
textareaElement.tabIndex = -1
document.body.appendChild(textareaElement)

export function setValue(value) {
  textareaElement.value = value
  if (document.activeElement === textareaElement) {
    textareaElement.select()
  }
}

export function focus() {
  if (document.activeElement !== textareaElement) {
    // console.log('Textarea is not in focus')
  }
  // console.log('Giving focus to textarea')
  textareaElement.focus()
  textareaElement.select()
}

textareaElement.addEventListener('focus', () => {
  textareaElement.select()
})

textareaElement.addEventListener(
  'blur',
  (e) => {
    console.log('Blur event on textarea')
  },
  true,
)

textareaElement.addEventListener('compositionstart', (e) => {
  compositionStateChange('start', e.data)
})

textareaElement.addEventListener('compositionupdate', (e) => {
  compositionStateChange('update', e.data)
})

textareaElement.addEventListener('compositionend', (e) => {
  compositionStateChange('end', e.data)
})

textareaElement.addEventListener('input', (e) => {
  console.log('input', JSON.stringify(e.data), e.inputType)
  if (e.isComposing) return
  if (e.inputType === 'deleteContentBackward') return
  if (e.inputType === 'deleteContentForward') return
  if (e.inputType === 'insertLineBreak') return
  // if (e.inputType === 'insertCompositionText') return
  if (e.inputType === 'insertFromPaste') {
    insertText(textareaElement.value, e.inputType)
    return
  }
  if (e.data === null) return

  if (e.data.match(/^\s+$/)) {
    space()
    return
  }

  insertText(e.data, e.inputType)
  focus()
})

textareaElement.addEventListener('keydown', (e) => {
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
    moveToNextLine()
    return
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    moveToNextCell()
    return
  }

  if (e.key === ' ') {
    if (!e.ctrlKey) {
      e.preventDefault()
      space()
      return
    }
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
