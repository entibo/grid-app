export function init() {
  return {
    stack: [],
    index: -1,
  }
}

function lastIndex(h) {
  return h.stack.length - 1
}

export function canUndo(h) {
  return h.index > 0
}

export function canRedo(h) {
  return h.index < lastIndex(h)
}

export function save(h, value) {
  if (canRedo(h)) {
    h.stack = h.stack.slice(0, h.index + 1)
  }
  h.stack.push(value)
  h.index = lastIndex(h)
}

export function undo(h) {
  if (!canUndo(h)) return
  h.index--
  return h.stack[h.index]
}

export function redo(h) {
  if (!canUndo(h)) return
  h.index++
  return h.stack[h.index]
}
