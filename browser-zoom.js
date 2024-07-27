// This module's job is to track the amount of content
// that has moved under the cursor as a result of zooming

// NOTE: this assumes the content is the whole viewport

import { emitter } from './emitter.js'
import { signal, computed, effect } from '@preact/signals-core'
import * as Point from './point.js'

export const $zoom = signal(window.devicePixelRatio)
export const onZoom = emitter()

let currentCursorPosition = { x: 0, y: 0 }

addEventListener('pointermove', (e) => {
  currentCursorPosition = { x: e.clientX, y: e.clientY }
})

addEventListener('resize', (e) => {
  const zoom = $zoom.value
  const newZoom = window.devicePixelRatio
  if (newZoom === zoom) return

  const newCursorPosition = Point.round(
    Point.scale(currentCursorPosition, zoom / newZoom),
  )
  const cursorOffset = Point.sub(newCursorPosition, currentCursorPosition)

  onZoom.emit({ zoom, cursorOffset })
  $zoom.value = newZoom
  currentCursorPosition = newCursorPosition
})
