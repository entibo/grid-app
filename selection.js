import { signal, computed, effect } from '@preact/signals-core'
import { clamp, debounce } from './util.js'
import * as Grid from './grid.js'
import * as Range from './range.js'
//

export const $selection = signal({
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
})

export function select(start, end = start) {
  $selection.value = { start, end }
}
export function selectTo(end) {
  const { start } = $selection.value
  $selection.value = { start, end }
}
export function clearSelection() {
  const { end } = $selection.value
  select(end, end)
}

//

export const $selectionRange = computed(() => {
  const { start, end } = $selection.value
  return Range.fromPoints(start, end)
})

export const $selectionText = computed(() => {
  return Grid.readRange($selectionRange.value)
})

//

export const $contentRange = signal({ x: 0, y: 0, width: 0, height: 0 })
const updateContentRange = debounce(function (cellMap) {
  const positions = Array.from(cellMap.values()).map(({ position }) => position)
  $contentRange.value = Range.getBoundingRange(positions)
}, 0)
effect(() => updateContentRange(Grid.$cellMap.value))

//

export const $horizontal = signal(true)
//

export const $paragraphRange = computed(() => {
  const selectionRange = $selectionRange.value
  const right = Grid.getLengthUntilBlank(
    {
      x: selectionRange.x + selectionRange.width,
      y: selectionRange.y,
    },
    2,
    // direction
  )
  return {
    ...selectionRange,
    width: right - selectionRange.x,
  }
})
