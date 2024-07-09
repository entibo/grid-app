import * as Range from './range.js'
import * as Point from './point.js'
import { signal } from './signal.js'

const $scrollBox = document.createElement('div')
$scrollBox.className = 'scrollBox'

const $scrollContent = document.createElement('div')
$scrollContent.className = 'scrollContent'
$scrollBox.appendChild($scrollContent)

export function mount(parent) {
  parent.appendChild($scrollBox)
  // set viewDimensions?
}

let viewDimensions = { width: 0, height: 0 }
new ResizeObserver(() => {
  viewDimensions = {
    width: $scrollBox.offsetWidth,
    height: $scrollBox.offsetHeight,
  }
  console.log('scrollBox resized!', viewDimensions)
}).observe($scrollBox)

let scrollRange = { x: 0, y: 0, width: 0, height: 0 }
let isProgrammaticallyScrolling = false

export function update(contentRange, viewPosition) {
  const viewRange = {
    ...viewPosition,
    ...viewDimensions,
  }

  const scrollRange = Range.getBoundingRange([viewRange, contentRange])
  $scrollContent.style.width = `${scrollRange.width}px`
  $scrollContent.style.height = `${scrollRange.height}px`

  console.log(contentRange, viewRange, scrollRange)

  const scrollOffset = Point.sub(viewRange, scrollRange)
  console.log('calling scroll', scrollOffset.x, scrollOffset.y)
  $scrollBox.scroll({
    behavior: 'instant',
    left: scrollOffset.x,
    top: scrollOffset.y,
  })
  isProgrammaticallyScrolling = true
}

export const onScroll = signal()

$scrollBox.addEventListener('scroll', (e) => {
  console.log('scrol event', $scrollBox.scrollLeft, $scrollBox.scrollTop)
  if (isProgrammaticallyScrolling) {
    isProgrammaticallyScrolling = false
    return
  }

  onScroll.emit({
    x: scrollRange.x + $scrollBox.scrollLeft,
    y: scrollRange.y + $scrollBox.scrollTop,
  })
})
