import { isKeyDown, keyDownTime } from './keyboard-global.js'
import {
  clearSelection,
  compositionStateChange,
  insertText,
  redo,
  selectAll,
  selectColumn,
  selectRow,
  undo,
} from './controller.js'

function doesCompleteCombo(key, comboKeys, delay = 200) {
  if (!comboKeys.includes(key)) return false
  return comboKeys
    .filter((k) => k !== key)
    .every((k) => isKeyDown(k) && keyDownTime(k) < delay)
}

export function init(element, emit) {
  element.addEventListener('compositionstart', (e) => {
    compositionStateChange('start', e.data)
  })

  element.addEventListener('compositionupdate', (e) => {
    compositionStateChange('update', e.data)
  })

  element.addEventListener('compositionend', (e) => {
    compositionStateChange('end', e.data)
  })

  element.addEventListener('input', (e) => {
    console.log('input', e.data, e.inputType)
    if (e.isComposing) return
    if (e.inputType === 'deleteContentBackward') return
    if (e.inputType === 'insertLineBreak') return
    // if (e.inputType === 'insertCompositionText') return
    // if (e.inputType === 'insertFromPaste') return

    insertText(e.data, e.inputType)
  })

  element.addEventListener('keydown', (e) => {
    console.log('keydown', e.key)

    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      copy()
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'x') {
      cut()
    }

    if (e.key === 'Tab') {
      e.preventDefault()
    }

    if (e.shiftKey && doesCompleteCombo(e.key, ['ArrowUp', 'ArrowDown'])) {
      selectColumn()
    }

    if (e.shiftKey && doesCompleteCombo(e.key, ['ArrowLeft', 'ArrowRight'])) {
      selectRow()
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      selectAll()
    }

    if (e.key === 'Escape') {
      clearSelection()
    }

    const arrowMotion = {
      ArrowUp: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 },
      ArrowLeft: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
    }[e.key]
    if (arrowMotion) {
      e.preventDefault()
      let mode = 'normal'

      if (e.shiftKey) {
        mode = 'select'
      }

      if (e.altKey) {
        mode = 'displace'
      }

      m_ove(arrowMotion, mode)
    }

    if (e.key === 'Backspace') {
      e_rase(true, e.ctrlKey)
    }

    if (e.key === 'Delete') {
      e_rase(false, e.ctrlKey)
    }
  })
}
