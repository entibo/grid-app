import { getBoundingRange } from './range.js'
import { signal } from './signal.js'

export const onScroll = signal()

let viewRect = null
export function setViewRect(viewRect) {
  viewRect = viewRect
}

const $scrollBox = document.createElement('div')
$scrollBox.className = 'scrollBox'
document.body.appendChild($scrollBox)
export function mount(parent) {
  parent.appendChild($scrollBox)
}

export function updte(viewRange, contentRange) {
  const scrollRange = getBoundingRange(viewRange, contentRange)
  $scrollBox.style.width = `${scrollRange.dx + 1}px`
  $scrollBox.style.height = `${scrollRange.dy + 1}px`
}

{
  panOffset

  const viewRect = {
    x: -panOffset.x,
    y: -panOffset.y,
    width: $grid.clientWidth,
    height: $grid.clientHeight,
  }

  contentRect

  const scrollRect = boundingRect(viewRect, contentRect)

  // set dimensions of scrollbox element to scrollRect
  // omitted

  // set scroll position to viewRect{x,y} - scrollRect{x,y}
  // omitted
}

function panning(panOffset) {}

$scrollBox.addEventListener('scroll', (e) => {
  onScroll.emit({
    x: scrollRect.x + $scrollBox.scrollLeft,
    y: scrollRect.y + $scrollBox.scrollTop,
  })
})
