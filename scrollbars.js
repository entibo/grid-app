// import { signal } from './signal.js'

// const $scrollBox = document.createElement('div')
// $scrollBox.className = 'scrollBox'

// const $scrollContent = document.createElement('div')
// $scrollContent.className = 'scrollContent'
// $scrollBox.appendChild($scrollContent)

// export function mount(parent) {
//   parent.appendChild($scrollBox)
// }

// let isProgrammaticallyScrolling = false

// export function update({ width, height }, scrollOffset) {
//   $scrollContent.style.width = `${width}px`
//   $scrollContent.style.height = `${height}px`

//   isProgrammaticallyScrolling = true
//   $scrollBox.scroll({
//     behavior: 'instant',
//     left: scrollOffset.x,
//     top: scrollOffset.y,
//   })
// }

// export const onScroll = signal()

// $scrollBox.addEventListener('scroll', (e) => {
//   if (isProgrammaticallyScrolling) {
//     isProgrammaticallyScrolling = false
//     return
//   }

//   const scrollOffset = {
//     x: $scrollBox.scrollLeft,
//     y: $scrollBox.scrollTop,
//   }

//   onScroll.emit(scrollOffset)
// })
