export function fromPoints({ x: x1, y: y1 }, { x: x2, y: y2 }) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x1 - x2),
    height: Math.abs(y1 - y2),
  }
}

export function moveBy(range, { x, y }) {
  return {
    ...range,
    x: range.x + x,
    y: range.y + y,
  }
}

export function contains(range, { x, y }) {
  return (
    x >= range.x &&
    x <= range.x + range.width &&
    y >= range.y &&
    y <= range.y + range.height
  )
}

export function overlaps(range1, range2) {
  return (
    range1.x <= range2.x + range2.width &&
    range1.x + range1.width >= range2.x &&
    range1.y <= range2.y + range2.height &&
    range1.y + range1.height >= range2.y
  )
}

export function getBoundingRange(pointsAndRanges) {
  if (pointsAndRanges.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  let x_min = Infinity
  let x_max = -Infinity
  let y_min = Infinity
  let y_max = -Infinity
  for (const o of pointsAndRanges) {
    const isRange = typeof o.width === 'number'
    x_min = Math.min(x_min, o.x)
    y_min = Math.min(y_min, o.y)
    x_max = Math.max(x_max, isRange ? o.x + o.width : o.x)
    y_max = Math.max(y_max, isRange ? o.y + o.height : o.y)
  }
  return {
    x: x_min,
    y: y_min,
    width: x_max - x_min,
    height: y_max - y_min,
  }
}

//

export function getAdjacentPosition(range, offset, referencePosition = range) {
  const left = range.x
  const top = range.y
  const right = range.x + range.width
  const bottom = range.y + range.height

  let x = referencePosition.x
  if (offset.x > 0) {
    x = right + offset.x
  } else if (offset.x < 0) {
    x = left + offset.x
  }

  let y = referencePosition.y
  if (offset.y > 0) {
    y = bottom + offset.y
  } else if (offset.y < 0) {
    y = top + offset.y
  }

  return { x, y }
}

// Corner stuff

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
    x: range.x + range.width,
    y: range.y + range.height,
  }
}

export function topRight(range) {
  return {
    x: range.x + range.width,
    y: range.y,
  }
}

export function bottomLeft(range) {
  return {
    x: range.x,
    y: range.y + range.height,
  }
}

export function center(range) {
  return {
    x: range.x + Math.round(range.width / 2),
    y: range.y + Math.round(range.height / 2),
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
