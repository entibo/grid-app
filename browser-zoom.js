// This module's job is to track the amount of content
// that has moved under the cursor as a result of zooming

// NOTE: this assumes the content is the whole viewport

import { signal } from './signal.js'
import * as Point from './point.js'

export const onZoom = signal()

let currentCursorPosition = { x: 0, y: 0 }
let currentDevicePixelRatio = window.devicePixelRatio

addEventListener('pointermove', (e) => {
  currentCursorPosition = { x: e.clientX, y: e.clientY }
})

addEventListener('resize', (e) => {
  const newDevicePixelRatio = window.devicePixelRatio
  if (newDevicePixelRatio === currentDevicePixelRatio) return

  const zoomRatio = currentDevicePixelRatio / newDevicePixelRatio

  const newCursorPosition = Point.round(
    Point.scale(currentCursorPosition, zoomRatio),
  )
  const offset = Point.sub(newCursorPosition, currentCursorPosition)
  onZoom.emit(offset)

  currentDevicePixelRatio = newDevicePixelRatio
  currentCursorPosition = newCursorPosition
})
