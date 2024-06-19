let keyStateMap = {}
const keyStateChangeCallbacks = {}

export function listenToKeyStateChange(key, callback) {
  keyStateChangeCallbacks[key] = [
    ...(keyStateChangeCallbacks[key] || []),
    callback,
  ]
}

export function isKeyDown(key) {
  return !!keyStateMap[key]
}

export function keyDownTime(key) {
  const pressedTime = keyStateMap[key]
  if (!pressedTime) return 0
  return Date.now() - pressedTime
}

// @ts-ignore
addEventListener('keydown', ({ key }) => {
  // console.log('global keydown', key)
  if (keyStateMap[key]) return
  for (const callback of keyStateChangeCallbacks[key] || []) {
    callback(true)
  }
  keyStateMap[key] = Date.now()
})

// @ts-ignore
addEventListener('keyup', ({ key }) => {
  delete keyStateMap[key]
  for (const callback of keyStateChangeCallbacks[key] || []) {
    callback(false)
  }
})

addEventListener('blur', () => {
  for (const key in keyStateMap) {
    for (const callback of keyStateChangeCallbacks[key] || []) {
      callback(false)
    }
  }
  keyStateMap = {}
})
