// AI Generated
/**
 * Debounces a function.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The time in milliseconds to wait before calling the function.
 * @param {boolean} [immediate=false] - Whether to call the function immediately.
 * @returns {Function} - The debounced function.
 */
export function debounce(func, wait, immediate = false) {
  let timeout

  return function () {
    const context = this
    const args = arguments

    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) {
      func.apply(context, args)
    }
  }
}

// AI Generated
/**
 * Partitions an array based on a predicate function.
 *
 * @param {Array} array - The array to partition.
 * @param {Function} predicate - The predicate function.
 * @returns {Array} - An array of [pass,fail]
 */
export function partition(array, predicate) {
  return array.reduce(
    (acc, elem, index) => {
      acc[predicate(elem, index) ? 0 : 1].push(elem)
      return acc
    },
    [[], []],
  )
}

export function filterMap(map, predicate) {
  return new Map(
    Array.from(map).filter(([key, value]) => predicate(key, value)),
  )
}

export function lerp(a, b, t) {
  return a * (1 - t) + b * t
}