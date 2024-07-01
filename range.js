export function fromPoints({ x: x1, y: y1 }, { x: x2, y: y2 }) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    dx: Math.abs(x1 - x2),
    dy: Math.abs(y1 - y2),
  }
}

export function move(range, offset) {
  return {
    ...range,
    x: range.x + offset.x,
    y: range.y + offset.y,
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

export function getBoundingRange(points) {
  let x_min = Infinity
  let x_max = -Infinity
  let y_min = Infinity
  let y_max = -Infinity
  for (const { x, y } of points) {
    x_min = Math.min(x_min, x)
    x_max = Math.max(x_max, x)
    y_min = Math.min(y_min, y)
    y_max = Math.max(y_max, y)
  }
  return {
    x: x_min,
    y: y_min,
    dx: x_max - x_min,
    dy: y_max - y_min,
  }
}
