export function history() {
  return {
    past: [],
    future: [],
    workingBackup: null,
  }
}

export function checkpoint(h, getState) {
  h.past.push(getState())
  h.future = []
  h.workingBackup = null
}

export function undo(h, getState, setState) {
  if (!h.past.length) return
  h.future.push(h.workingBackup ?? getState())
  setState((h.workingBackup = h.past.pop()))
}

export function redo(h, getState, setState) {
  if (!h.future.length) return
  h.past.push(h.workingBackup ?? getState())
  setState((h.workingBackup = h.future.pop()))
}
