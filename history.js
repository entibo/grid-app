let stack = []
let index = -1

function lastIndex() {
  return stack.length - 1
}

export function canUndo() {
  return index > 0
}

export function canRedo() {
  return index < lastIndex()
}

export function save(value) {
  if (canRedo()) {
    stack = stack.slice(0, index + 1)
  }
  stack.push(value)
  index = lastIndex()
}

export function undo() {
  if (!canUndo()) return
  index--
  return stack[index]
}

export function redo() {
  if (!canUndo()) return
  index++
  return stack[index]
}
