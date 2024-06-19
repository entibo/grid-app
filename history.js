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

// export function History({ save, load }) {
//   let past = []
//   let future = []
//   let workingBackup = null

//   return {
//     checkpoint() {
//       const backup = save()
//       console.log('checkpoint', JSON.stringify(backup.cursor))
//       past.push(backup)
//       future = []
//       workingBackup = null
//     },
//     undo() {
//       if (!past.length) return
//       console.log('undo')
//       future.push(workingBackup ?? save())
//       const backup = past.pop()
//       workingBackup = backup
//       load(workingBackup)
//     },
//     redo() {
//       if (!future.length) return
//       console.log('redo')
//       past.push(workingBackup ?? save())
//       const backup = future.pop()
//       workingBackup = backup
//       load(workingBackup)
//     },
//   }
// }
