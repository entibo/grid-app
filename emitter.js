export function emitter() {
  const fns = []

  function subscribe(fn) {
    fns.push(fn)
    const unsubscribe = () => {
      const index = fns.indexOf(fn)
      if (index === -1) return
      fns.splice(index, 1)
    }
    return unsubscribe
  }

  subscribe.subscribe = subscribe

  subscribe.emit = (...args) => fns.forEach((fn) => fn(...args))

  return subscribe
}
