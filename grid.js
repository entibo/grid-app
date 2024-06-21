export function nextCharacter({ x, y }, dir = 'horizontal') {
  if (dir === 'horizontal') {
    return { x: x + 1, y }
  } else {
    return { x, y: y + 1 }
  }
}

export function nextLine({ x, y }, dir = 'horizontal') {
  if (dir === 'horizontal') {
    return { x, y: y + 1 }
  } else {
    return { x: x - 1, y }
  }
}

export function isWithinRange({ x, y }, range) {
  console.log('isWithinRange', x, y, range)
  range = positiveRange(range)
  return (
    x >= range.x &&
    x <= range.x + range.dx &&
    y >= range.y &&
    y <= range.y + range.dy
  )
}

export function positiveRange({ x, y, dx, dy }) {
  if (dx < 0) {
    x += dx
    dx = -dx
  }
  if (dy < 0) {
    y += dy
    dy = -dy
  }
  return { x, y, dx, dy }
}

export function getPositionDelta(a, b) {
  return {
    dx: b.x - a.x,
    dy: b.y - a.y,
  }
}

function isEmptyValue(value) {
  return !value || value.match(/\s+/)
}

function normalizeValue(value) {
  if (isEmptyValue(value)) return '　'
  return value
}

export function trimText(text) {
  const lines = text.split('\n').map((line) => line.trimEnd())
  while (lines.at(-1) === '') lines.pop()
  return lines.join('\n')
}

export function readRange({ read }, range) {
  console.log('readRange', range, range.dx * range.dy)
  range = positiveRange(range)
  const lines = []
  for (let y = range.y; y <= range.y + range.dy; y++) {
    let line = ''
    for (let x = range.x; x <= range.x + range.dx; x++) {
      line += normalizeValue(read({ x, y }))
    }
    lines.push(line)
  }
  return lines.join('\n')
}

export function writeRange({ write }, range, value) {
  range = positiveRange(range)
  for (let y = range.y; y <= range.y + range.dy; y++) {
    for (let x = range.x; x <= range.x + range.dx; x++) {
      write({ x, y }, value)
    }
  }
}

export function deleteRange({ write }, range) {
  writeRange({ write }, range, '')
}

export function writeText({ write }, { x, y }, text, dir = 'horizontal') {
  // console.log('grid write', x, y, text)
  if (!text) {
    write({ x, y }, '')
    return { x, y, dx: 0, dy: 0 }
  }
  if (text.length === 1) {
    write({ x, y }, text)
    return { x, y, dx: 0, dy: 0 }
  }

  const lines = text.split('\n')
  let longestLineLength = 0
  for (let i = 0; i < lines.length; i++) {
    longestLineLength = Math.max(longestLineLength, lines[i].length)
    for (let j = 0; j < lines[i].length; j++) {
      write(
        dir === 'horizontal' ? { x: x + j, y: y + i } : { x: x - i, y: y + j },
        lines[i][j],
      )
    }
  }
  if (dir === 'horizontal') {
    return { x, y, dx: longestLineLength - 1, dy: lines.length - 1 }
  } else {
    return {
      x: x - lines.length + 1,
      y: y,
      dx: lines.length - 1,
      dy: longestLineLength - 1,
    }
  }
}

export function cycleCellValues({ read, write }, cells, forward = true) {
  if (forward) cells = cells.reverse()
  const firstValue = read(cells[0])
  for (let i = 0; i < cells.length - 1; i++) {
    write(cells[i], read(cells[i + 1]))
  }
  write(cells.at(-1), firstValue)
}

export function moveRange({ read, write }, range, { dx, dy }) {
  range = positiveRange(range)
  if (dx) {
    const cycledRange = {
      x: dx < 0 ? range.x + dx : range.x,
      y: range.y,
      dx: range.dx + Math.abs(dx),
      dy: range.dy,
    }
    for (let y = cycledRange.y; y <= cycledRange.y + cycledRange.dy; y++) {
      const cells = []
      for (let x = cycledRange.x; x <= cycledRange.x + cycledRange.dx; x++) {
        cells.push({ x, y })
      }
      for (let i = 0; i < Math.abs(dx); i++)
        cycleCellValues({ read, write }, cells, dx > 0)
    }
  }
  if (dy) {
    const cycledRange = {
      x: range.x,
      y: dy < 0 ? range.y + dy : range.y,
      dx: range.dx,
      dy: range.dy + Math.abs(dy),
    }
    for (let x = cycledRange.x; x <= cycledRange.x + cycledRange.dx; x++) {
      const cells = []
      for (let y = cycledRange.y; y <= cycledRange.y + cycledRange.dy; y++) {
        cells.push({ x, y })
      }
      for (let i = 0; i < Math.abs(dy); i++)
        cycleCellValues({ read, write }, cells, dy > 0)
    }
  }
}
