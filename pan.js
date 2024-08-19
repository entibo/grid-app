import * as Point from './point.js'
import { signal } from '@preact/signals-core'

let targetOffset = null
export const $offset = signal({ x: 0, y: 0 })

export function moveBy(offset, transition = false) {
  if (transition) {
    stop()
    targetOffset = Point.add(targetOffset || $offset.value, offset)
  } else {
    $offset.value = Point.add($offset.value, offset)
  }
}

export function moveTo(offset, transition = false) {
  if (transition) {
    stop()
    targetOffset = offset
  } else {
    $offset.value = offset
  }
}

let velocity = { x: 0, y: 0 }
export function stop() {
  velocity = { x: 0, y: 0 }
}

// Update loop
{
  let previousTime = document.timeline.currentTime
  requestAnimationFrame(update)
  function update(time) {
    requestAnimationFrame(update)

    const ms = time - previousTime
    previousTime = time

    if (targetOffset) {
      $offset.value = tendTo($offset.value, targetOffset, 3 * ms)
      if (Point.equals($offset.value, targetOffset)) {
        targetOffset = null
      }
      return
    }

    velocity = tendTo(velocity, { x: 0, y: 0 }, ms)
    if (Point.equals(velocity, { x: 0, y: 0 })) return

    $offset.value = Point.add($offset.value, Point.scale(velocity, ms))
  }
}

export function startPanning(startScreenPosition) {
  stop()

  targetOffset = null

  let releaseVelocity = { x: 0, y: 0 }

  const startOffset = $offset.value

  let previousPosition = startScreenPosition
  let previousTime = performance.now()

  return {
    move(screenPosition) {
      const screenDistanceStart = Point.sub(screenPosition, startScreenPosition)

      $offset.value = Point.add(startOffset, screenDistanceStart)

      const time = performance.now()
      const ms = Math.max(1, time - previousTime)

      const targetVelocity = Point.scale(
        Point.sub(screenPosition, previousPosition),
        1 / ms,
      )

      releaseVelocity = Point.lerp(
        releaseVelocity,
        targetVelocity,
        Math.min(1, ms * 0.01),
      )

      previousPosition = screenPosition
      previousTime = time
    },
    end() {
      const ms = performance.now() - previousTime
      velocity = dampen(releaseVelocity, ms * 10)
    },
  }
}

//

function dampen(velocity, ms) {
  return Point.scale(velocity, 0.995 ** ms)
}

function tendTo(point, target, ms) {
  if (
    Math.abs(target.x - point.x) < 0.01 &&
    Math.abs(target.y - point.y) < 0.01
  ) {
    return target
  }
  return Point.lerp(point, target, 1 - 0.995 ** ms)
}
