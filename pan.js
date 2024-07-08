import { panChanged } from './index.js'
import * as Point from './point.js'

let targetPanOffset = null
export let panOffset = { x: 0, y: 0 }
export let scaleValue = 1

export function panBy(delta, transition = false) {
  if (transition) {
    velocity = { x: 0, y: 0 }
    targetPanOffset = Point.add(targetPanOffset || panOffset, delta)
  } else {
    setPanOffset(Point.add(panOffset, delta))
  }
}

export function setPanOffset(point) {
  // console.log('setPanOffset', panOffset, point)
  panOffset = point
  panChanged(point)
}

let velocity = { x: 0, y: 0 }

{
  let previousTime = document.timeline.currentTime
  requestAnimationFrame(update)
  function update(time) {
    requestAnimationFrame(update)

    const ms = time - previousTime
    previousTime = time

    if (targetPanOffset) {
      setPanOffset(tendTo(panOffset, targetPanOffset, 3 * ms))
      if (Point.equals(panOffset, targetPanOffset)) {
        targetPanOffset = null
      }
      return
    }

    velocity = tendTo(velocity, { x: 0, y: 0 }, ms)
    if (Point.equals(velocity, { x: 0, y: 0 })) return

    setPanOffset(Point.add(panOffset, Point.scale(velocity, ms)))
  }
}

export function startPanning(startScreenPosition) {
  velocity = { x: 0, y: 0 }

  targetPanOffset = null

  let releaseVelocity = { x: 0, y: 0 }

  const panOffsetStart = panOffset

  let previousPosition = startScreenPosition
  let previousTime = performance.now()

  return {
    move(screenPosition) {
      const screenDistanceStart = Point.sub(screenPosition, startScreenPosition)
      const scaledDistanceStart = Point.scale(
        screenDistanceStart,
        1 / scaleValue,
      )

      // console.log('move dsitance:', screenPosition)
      setPanOffset(Point.add(panOffsetStart, scaledDistanceStart))

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
