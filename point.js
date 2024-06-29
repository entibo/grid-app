export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(a, s) {
  return { x: a.x * s, y: a.y * s }
}

export function equals(a, b) {
  if (!a || !b) return false
  return a.x === b.x && a.y === b.y
}
