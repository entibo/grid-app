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
