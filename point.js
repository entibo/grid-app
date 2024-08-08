import * as Util from './util.js'

export function add(a, b, ...rest) {
  if (!a) return { x: 0, y: 0 }
  if (!b) return a
  if (rest.length) return add(add(a, b), ...rest)
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(point, scale) {
  if (typeof scale === 'number')
    return { x: point.x * scale, y: point.y * scale }
  return { x: point.x * scale.x, y: point.y * scale.y }
}

export function equals(a, b) {
  if (!a || !b) return false
  return a.x === b.x && a.y === b.y
}

export function lerp(a, b, t) {
  return { x: Util.lerp(a.x, b.x, t), y: Util.lerp(a.y, b.y, t) }
}

export function round(point) {
  return { x: Math.round(point.x), y: Math.round(point.y) }
}

//

export function nextPosition({ x, y }, horizontal) {
  if (typeof horizontal !== 'boolean')
    throw new Error('horizontal must be a boolean')
  return horizontal ? { x: x + 1, y } : { x, y: y + 1 }
}
export function previousPosition({ x, y }, horizontal) {
  if (typeof horizontal !== 'boolean')
    throw new Error('horizontal must be a boolean')
  return horizontal ? { x: x - 1, y } : { x, y: y - 1 }
}

export function nextLine({ x, y }, horizontal) {
  if (typeof horizontal !== 'boolean')
    throw new Error('horizontal must be a boolean')
  return horizontal ? { x, y: y + 1 } : { x: x - 1, y: y }
}
export function previousLine({ x, y }, horizontal) {
  if (typeof horizontal !== 'boolean')
    throw new Error('horizontal must be a boolean')
  return horizontal ? { x, y: y - 1 } : { x: x + 1, y: y }
}
