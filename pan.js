import * as Point from './point.js'
import { signal } from './signal.js'

let targetOffset = null
export const $offset = signal({ x: 0, y: 0 })

export function moveBy(offset, transition = false) {
  if (transition) {
    stop()
    targetOffset = Point.add(targetOffset || $offset.value, offset)
  } else {
    $offset.update((currentOffset) => Point.add(currentOffset, offset))
  }
}

let velocity = { x: 0, y: 0 }
export function stop() {
  velocity = { x: 0, y: 0 }
}

{
  let previousTime = document.timeline.currentTime
  requestAnimationFrame(update)
  function update(time) {
    requestAnimationFrame(update)

    const ms = time - previousTime
    previousTime = time

    if (targetOffset) {
      $offset.update((currentOffset) =>
        tendTo(currentOffset, targetOffset, 3 * ms),
      )
      if (Point.equals($offset(), targetOffset)) {
        targetOffset = null
      }
      return
    }

    velocity = tendTo(velocity, { x: 0, y: 0 }, ms)
    if (Point.equals(velocity, { x: 0, y: 0 })) return

    $offset.update((currentOffset) =>
      Point.add(currentOffset, Point.scale(velocity, ms)),
    )
  }
}

export function startPanning(startScreenPosition) {
  stop()

  targetOffset = null

  let releaseVelocity = { x: 0, y: 0 }

  const startOffset = $offset()

  let previousPosition = startScreenPosition
  let previousTime = performance.now()

  return {
    move(screenPosition) {
      const screenDistanceStart = Point.sub(screenPosition, startScreenPosition)

      $offset.set(Point.add(startOffset, screenDistanceStart))

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
