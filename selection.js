import { signal, computed, effect } from '@preact/signals-core'
import { clamp, debounce } from './util.js'
import * as Grid from './grid.js'
import * as Range from './range.js'
//

export const $selection = signal({
  direction: { x: 1, y: 0 },
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
})

export const isHorizontal = ({ x, y }) => x
export const isVertical = ({ x, y }) => y
export function setDirection(direction) {
  $selection.value = { ...$selection.value, direction }
}

export function select(
  start,
  end = start,
  direction = $selection.value.direction,
) {
  $selection.value = { direction, start, end }
}
export function selectTo(end) {
  const { direction, start } = $selection.value
  $selection.value = { direction, start, end }
}
export function moveSelectionBy(offset) {
  const { direction, start, end } = $selection.value
  $selection.value = {
    direction,
    start: Point.add(start, offset),
    end: Point.add(end, offset),
  }
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
