export function fromPoints({ x: x1, y: y1 }, { x: x2, y: y2 }) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    dx: Math.abs(x1 - x2),
    dy: Math.abs(y1 - y2),
  }
}

export function move(range, { dx, dy }) {
  return {
    ...range,
    x: range.x + dx,
    y: range.y + dy,
  }
}

export function contains(range, { x, y }) {
  return (
    x >= range.x &&
    x <= range.x + range.dx &&
    y >= range.y &&
    y <= range.y + range.dy
  )
}
