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

export function overlaps(range1, range2) {
  return (
    range1.x <= range2.x + range2.dx &&
    range1.x + range1.dx >= range2.x &&
    range1.y <= range2.y + range2.dy &&
    range1.y + range1.dy >= range2.y
  )
}

export function getBoundingRange(pointsAndRanges) {
  let x_min = Infinity
  let x_max = -Infinity
  let y_min = Infinity
  let y_max = -Infinity
  for (const o of pointsAndRanges) {
    const isRange = typeof o.dx === 'number'
    x_min = Math.min(x_min, o.x)
    y_min = Math.min(y_min, o.y)
    x_max = Math.max(x_max, isRange ? o.x + o.dx : o.x)
    y_max = Math.max(y_max, isRange ? o.y + o.dy : o.y)
  }
  return {
    x: x_min,
    y: y_min,
    dx: x_max - x_min,
    dy: y_max - y_min,
  }
}

export const TOP_LEFT = 'top-left'
export const TOP_RIGHT = 'top-right'
export const BOTTOM_LEFT = 'bottom-left'
export const BOTTOM_RIGHT = 'bottom-right'

export function oppositeCorner(corner) {
  switch (corner) {
    case TOP_LEFT:
      return BOTTOM_RIGHT
    case TOP_RIGHT:
      return BOTTOM_LEFT
    case BOTTOM_LEFT:
      return TOP_RIGHT
    case BOTTOM_RIGHT:
      return TOP_LEFT
  }
}

export function getCorner(range, corner) {
  switch (corner) {
    case TOP_LEFT:
      return topLeft(range)
    case TOP_RIGHT:
      return topRight(range)
    case BOTTOM_LEFT:
      return bottomLeft(range)
    case BOTTOM_RIGHT:
      return bottomRight(range)
  }
}

export function topLeft(range) {
  return { x: range.x, y: range.y }
}

export function bottomRight(range) {
  return {
    x: range.x + range.dx,
    y: range.y + range.dy,
  }
}

export function topRight(range) {
  return {
    x: range.x + range.dx,
    y: range.y,
  }
}

export function bottomLeft(range) {
  return {
    x: range.x,
    y: range.y + range.dy,
  }
}

export function center(range) {
  return {
    x: range.x + Math.round(range.dx / 2),
    y: range.y + Math.round(range.dy / 2),
  }
}

export function whichCornerIs(range, point) {
  if (point.x <= range.x) {
    if (point.y <= range.y) {
      return TOP_LEFT
    } else {
      return BOTTOM_LEFT
    }
  } else {
    if (point.y <= range.y) {
      return TOP_RIGHT
    } else {
      return BOTTOM_RIGHT
    }
  }
}
