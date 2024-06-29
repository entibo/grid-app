import { screenToGrid } from './view.js'
import { listenToKeyStateChange } from './keyboard-global.js'
import { leftClickStart, rightClickStart } from './controller.js'

const LEFT = 0
const RIGHT = 2

function setPointerType(type = 'auto') {
  // grid.style.cursor = type
}

let left = null
let right = null

addEventListener('mousedown', (e) => {
  const position = screenToGrid(e)
  if (e.button === LEFT) {
    left = leftClickStart(position, e.shiftKey)
  } else if (e.button === RIGHT) {
    right = rightClickStart(position, e.shiftKey)
  }
  e.preventDefault()
})

addEventListener('mousemove', (e) => {
  const position = screenToGrid(e)
  left?.move?.(position)
  right?.move?.(position)
})

addEventListener('blur', stop)
addEventListener('mouseup', stop)
function stop(e) {
  const position = screenToGrid(e)
  if (e.button === LEFT && left) {
    left.end?.(position)
    left = null
  }
  if (e.button === RIGHT && right) {
    right.end?.(position)
    right = null
  }
}

addEventListener('contextmenu', (e) => {
  e.preventDefault()
})
