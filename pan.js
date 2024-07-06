import { panChanged, zoomChanged } from './index.js'
import * as Point from './point.js'

let targetPanOffset = null
export let panOffset = { x: 0, y: 0 }
export let scaleValue = 1

export function panBy(delta) {
  targetPanOffset = Point.add(targetPanOffset || panOffset, delta)
  velocity = { x: 0, y: 0 }
}

export function zoomBy(deltaZoom) {
  targetPanOffset = null

  scaleValue = Math.max(0.1, Math.min(10, scaleValue * (1 + deltaZoom)))
  zoomChanged(scaleValue)
}

export function setPanOffset(point) {
  panOffset = point
  panChanged(point)
}

export function setScale(scale) {
  scaleValue = scale
  zoomChanged(scale)
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

export function startZooming(startScreenPosition) {
  velocity = { x: 0, y: 0 }

  targetPanOffset = null

  let releaseVelocity = { x: 0, y: 0 }

  const panOffsetStart = panOffset
  const scaleValueStart = scaleValue

  let previousScreenPosition = startScreenPosition
  let previousTime = performance.now()
g
  return {
    move(screenPosition) {
      const screenDistanceStart = Point.sub(screenPosition, startScreenPosition)
      // How sensitive is the zooming?
      const amount = screenDistanceStart.x - screenDistanceStart.y
      const scaleChange = Math.exp(amount / 200)
      const newScaleValue = Math.max(0.1, scaleValueStart * scaleChange)

      const cursorOffset = Point.sub(
        Point.scale(startScreenPosition, 1 / newScaleValue),
        Point.scale(startScreenPosition, 1 / scaleValueStart),
      )

      // const cursorOffset = Point.sub(
      //   Point.scale(screenPosition, 1 / newScaleValue),
      //   Point.scale(startScreenPosition, 1 / scaleValueStart),
      // )

      const newPanOffset = Point.add(panOffsetStart, cursorOffset)

      setScale(newScaleValue)
      setPanOffset(newPanOffset)

      //

      const time = performance.now()
      const ms = Math.max(1, time - previousTime)

      const targetVelocity = Point.scale(
        Point.sub(screenPosition, previousScreenPosition),
        1 / ms,
      )

      releaseVelocity = Point.lerp(
        releaseVelocity,
        targetVelocity,
        Math.min(1, ms * 0.01),
      )

      previousScreenPosition = screenPosition
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
