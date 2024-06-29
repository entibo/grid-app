import * as Point from './point.js'
import * as Range from './range.js'
import { mapChanges, partition } from './util.js'

export const CELL_REMOVED = 'cell-removed'
export const CELL_UPDATED = 'cell-updated'
export const CELL_CREATED = 'cell-created'
export const CELL_POSITION_CHANGED = 'cell-position-changed'

let nextId = 0
export function cell(position, value) {
  const id = (nextId++).toString()
  return { position, value, id }
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

function getBounds(cells) {
  let x_min = Infinity
  let x_max = -Infinity
  let y_min = Infinity
  let y_max = -Infinity
  for (const cell of cells) {
    x_min = Math.min(x_min, cell.position.x)
    x_max = Math.max(x_max, cell.position.x)
    y_min = Math.min(y_min, cell.position.y)
    y_max = Math.max(y_max, cell.position.y)
  }
  return {
    x: x_min,
    y: y_min,
    dx: x_max - x_min,
    dy: y_max - y_min,
  }
}

export function getCellsInRange(cells, range) {
  return cells.filter((cell) => Range.contains(range, cell.position))
}

function getCellIndex(cells, { x, y }) {
  return cells.findIndex(
    (cell) => cell.position.x === x && cell.position.y === y,
  )
}

function createCellAt(cells, position) {
  const cell = { position, value: null }
  const index = cells.push(cell) - 1
  return { cells, index }
}

function getOrCreateCellAt(cells, position) {
  {
    const index = getCellIndex(cells, position)
    if (index >= 0) {
      return { cells, index }
    }
  }
  const { cells: updatedCells, index } = createCellAt(cells, position)
  return { cells: updatedCells, index, created: true }
}

export function writeCellAt(cells, position, value) {
  const {
    cells: updatedCells,
    index,
    created,
  } = getOrCreateCellAt(cells, position)

  updatedCells[index] = { ...updatedCells[index], value }

  return {
    cells: updatedCells,
    deltaCells: [{ cell: updatedCells[index], created, updated: true }],
  }
}

export function writeRange(cells, range, pseudoCells) {
  // Index newCells by position for O(1) lookups
  const pseudoCellMap = new Map()
  for (const cell of pseudoCells) {
    const key = `${cell.position.x},${cell.position.y}`
    pseudoCellMap.set(key, cell)
  }

  // If there exist cells in target range:
  // either update them to a value defined in newCells
  // or remove them
  const untouchedCells = []
  const updatedCells = []
  const removedCells = []

  for (const cell of cells) {
    if (!Range.contains(range, cell.position)) {
      untouchedCells.push(cell)
      continue
    }

    const key = `${cell.position.x},${cell.position.y}`
    const pseudoCell = pseudoCellMap.get(key)
    if (pseudoCell) {
      pseudoCellMap.delete(key) // Remove processed cell from map
      const updatedCell = { ...cell, value: pseudoCell.value }
      updatedCells.push(updatedCell)
      continue
    }

    removedCells.push(cell)
    continue
  }

  // Remaining new cells are the ones that were not matched with existing cells
  const createdCells = [...pseudoCellMap.values()].map(({ position, value }) =>
    cell(position, value),
  )

  return [
    [...untouchedCells, ...updatedCells, ...createdCells],
    [
      ...updatedCells.map((cell) => [CELL_UPDATED, cell]),
      ...createdCells.map((cell) => [CELL_CREATED, cell]),
      ...removedCells.map((cell) => [CELL_REMOVED, cell]),
    ],
  ]
}

// export function writeRange(cells, range, newCells) {
//   const removal = removeRange(cells, range)
//   return {
//     cells: [removal.cells, ...newCells],
//     deltaCells: [
//       ...removal.deltaCells,
//       ...newCells.map((cell) => ({ cell, created: true })),
//     ],
//   }
//   //   const [cellsToKeep, cellsToRemove] = partition(cells, (cell, index) => {
//   //     // keep?
//   //     if (!Range.contains(range,cell.position)) return true

//   //     !positionedValues.find(
//   //       ({ position: { x, y } }) =>
//   //         x === cell.position.x && y === cell.position.y,
//   //     )
//   //   })
// }

export function removeAt(cells, position) {
  const index = getCellIndex(cells, position)
  if (index < 0) {
    return [cells, []]
  }
  const removedCell = cells[index]
  return [
    [...cells.slice(0, index), ...cells.slice(index + 1)],
    [[CELL_REMOVED, removedCell]],
  ]
}

export function removeRange(cells, range) {
  const [cellsToRemove, cellsToKeep] = partition(cells, (cell) =>
    Range.contains(range, cell.position),
  )
  return [cellsToKeep, cellsToRemove.map((cell) => [CELL_REMOVED, cell])]
}





//--

// Convert text to {position, value}
function textToPositionedValues(text) {
  const lines = text.split('\n')
  const positionedValues = []
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y]
    for (let x = 0; x < line.length; x++) {
      positionedValues.push({ position: { x, y }, value: line[x] })
    }
  }
  return positionedValues
}

const defaultTextValue = '\u3000'
function positionedValuesToText(positionedValues) {
  const bounds = getBounds(positionedValues)

  const valuesByY = new Map()
  for (const { position, value } of positionedValues) {
    if (!valuesByY.has(position.y)) valuesByY.set(position.y, [])
    valuesByY.get(position.y).push({ position, value })
  }

  const lines = []
  for (let y = bounds.y; y <= bounds.y + bounds.dy; y++) {
    let line = ''
    const entries = valuesByY.get(y) ?? []
    for (let x = bounds.x; x <= bounds.x + bounds.dx; x++) {
      const entry = entries.find(({ position }) => position.x === x)
      line += entry ? entry.value : defaultTextValue
    }
    lines.push(line)
  }

  return lines.join('\n')
}
