import { listenToKeyStateChange } from './keyboard-global.js'
import { leftClickStart, rightClickStart, scroll } from './index.js'

const BUTTON_LEFT = 0
const BUTTON_RIGHT = 2

let left = null
let right = null

addEventListener('mousedown', (e) => {
  // Prevents moving focus away from the textarea
  e.preventDefault()
  e.stopPropagation()
})

addEventListener('pointerdown', (e) => {
  // console.log('pointerdown', e.button, e.pointerType)

  if (e.pointerType === 'touch') return

  const position = { x: e.clientX, y: e.clientY }
  if (e.button === BUTTON_LEFT) {
    left = leftClickStart(position, e.shiftKey)
  }

  if (e.button === BUTTON_RIGHT) {
    right = rightClickStart(position, e.shiftKey)
  }
})

addEventListener('pointermove', (e) => {
  const position = { x: e.clientX, y: e.clientY }
  left?.move?.(position)
  right?.move?.(position)
})

addEventListener('blur', () => {
  left = null
  right = null
})

addEventListener('pointerup', (e) => {
  // console.log('pointerup', e.button, e.pointerType)
  const position = { x: e.clientX, y: e.clientY }
  if (e.button === BUTTON_LEFT && left) {
    left.end?.(position)
    left = null
  }
  if (e.button === BUTTON_RIGHT && right) {
    right.end?.(position)
    right = null
  }
})

addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) return
    e.preventDefault()
    scroll({ x: -e.deltaX, y: -e.deltaY })
  },
  { passive: false },
)
