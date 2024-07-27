import { signal, computed, effect } from '@preact/signals-core'
import { emitter } from './emitter.js'

const containerElement = document.createElement('div')
containerElement.className = 'searchContainer'
document.body.appendChild(containerElement)

const inputElement = document.createElement('input')
inputElement.type = 'text'
inputElement.placeholder = 'Search...'
containerElement.appendChild(inputElement)

const previousBtnElement = document.createElement('button')
previousBtnElement.textContent = '↑'
containerElement.appendChild(previousBtnElement)

const nextBtnElement = document.createElement('button')
nextBtnElement.textContent = '↓'
containerElement.appendChild(nextBtnElement)

const closeBtnElement = document.createElement('button')
closeBtnElement.textContent = '✕'
containerElement.appendChild(closeBtnElement)

//

export const $isOpen = signal(false)

export function close() {
  $isOpen = false
  containerElement.style.display = 'none'
}

export function open(text) {
  $isOpen = true
  containerElement.style.display = 'block'
  if (text !== undefined) inputElement.value = text.trim()
  inputElement.focus()
  inputElement.select()
  onSearch.emit(inputElement.value)
}

//

containerElement.addEventListener('focusout', (e) => {
  if (containerElement.contains(e.relatedTarget)) return
  console.log('focusout', e)
  close()
})

containerElement.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    close()
  }
})

previousBtnElement.addEventListener('click', findPrevious)
nextBtnElement.addEventListener('click', findNext)
closeBtnElement.addEventListener('click', close)

inputElement.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) {
      findPrevious()
    } else {
      findNext()
    }
  }
})

//

export const onSearch = emitter()

inputElement.addEventListener('input', () => onSearch.emit(inputElement.value))

//

export const $searchResults = signal([])

const $index = signal(0)
$searchResults.subscribe(() => ($index.value = 0))

export const $highlightedResult = computed(
  () => $searchResults.value[$index.value],
)

$searchResults.subscribe(({ length }) => {
  previousBtnElement.disabled = length === 0
  nextBtnElement.disabled = length === 0
})

function findPrevious() {
  const { length } = $searchResults.value
  $index.value = ($index.value - 1 + length) % length
}

function findNext() {
  const { length } = $searchResults.value
  $index.value = ($index.value + 1 + length) % length
}
