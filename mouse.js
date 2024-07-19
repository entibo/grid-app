import { leftClickStart, rightClickStart } from './index.js'
import { signal } from './signal.js'

const BUTTON_LEFT = 0
const BUTTON_RIGHT = 2

let left = null
let right = null
let buttonsState = 0
let lastPosition = { x: 0, y: 0 }

function startLeft(e) {
  left = leftClickStart({ x: e.clientX, y: e.clientY }, e.shiftKey)
}
function startRight(e) {
  right = rightClickStart({ x: e.clientX, y: e.clientY }, e.ctrlKey)
}
function stopLeft() {
  left?.end?.(lastPosition)
  left = null
}
function stopRight() {
  right?.end?.(lastPosition)
  right = null
}

//

/* addEventListener(
  'mousedown',
  (e) => {
    // Prevents moving focus away from the textarea
    e.preventDefault()
    e.stopPropagation()
  },
  { passive: false, capture: true },
) */
import * as View from './view.js'
View.gridElement.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') return

  e.preventDefault()
  e.stopPropagation()
  // return
  buttonsState = e.buttons
  if (buttonsState & 1) startLeft(e)
  if (buttonsState & 2) startRight(e)

  const position = { x: e.clientX, y: e.clientY }
  lastPosition = position
})

addEventListener('pointermove', (e) => {
  if (!(buttonsState & 1) && e.buttons & 1) startLeft(e)
  if (buttonsState & 1 && !(e.buttons & 1)) stopLeft()

  if (!(buttonsState & 2) && e.buttons & 2) startRight(e)
  if (buttonsState & 2 && !(e.buttons & 2)) stopRight()

  buttonsState = e.buttons

  const position = { x: e.clientX, y: e.clientY }
  lastPosition = position

  left?.move?.(position)
  right?.move?.(position)
})

addEventListener('pointerup', () => {
  stopLeft()
  stopRight()
})

addEventListener('blur', () => {
  stopLeft()
  stopRight()
})

//

addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

//

export const onScroll = signal()

addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) return
    onScroll.emit({ x: -e.deltaX, y: -e.deltaY })
    // Swiping left can be interpreted as "back"
    // e.preventDefault()
  },
  { passive: false },
)
