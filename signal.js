export function signal() {
  const callbacks = []

  const listen = function (callback) {
    callbacks.push(callback)
    return () => {
      const index = callbacks.indexOf(callback)
      if (index === -1) return
      callbacks.splice(index, 1)
    }
  }

  listen.emit = function (value) {
    callbacks.forEach((callback) => callback(value))
  }

  return listen
}
