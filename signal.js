export function signal(initialValue) {
  let currentValue = initialValue
  const callbacks = []

  function get() {
    if (arguments.length) {
      throw new Error('Get does not accept arguments')
    }
    return currentValue
  }

  get.get = get

  get.subscribe = (callback) => {
    callbacks.push(callback)
    const unsubscribe = () => {
      const index = callbacks.indexOf(callback)
      if (index === -1) return
      callbacks.splice(index, 1)
    }
    return unsubscribe
  }

  get.set = (newValue) => {
    if (newValue === currentValue) return
    const oldValue = currentValue
    currentValue = newValue
    callbacks.forEach((callback) => callback(newValue, oldValue))
  }

  get.update = (updater) => {
    const newValue = updater(currentValue)
    get.set(newValue)
  }

  get.emit = (...args) => {
    callbacks.forEach((callback) => callback(...args))
  }

  return get
}

export function computed(signals, callback) {
  const computedSignal = signal()
  const updateComputedValue = () => {
    const signalValues = signals.map((signal) => signal.get())
    const computedValue = callback(...signalValues)
    computedSignal.set(computedValue)
  }
  for (const signal of signals) {
    signal.subscribe(updateComputedValue)
  }
  updateComputedValue()
  return computedSignal
}
