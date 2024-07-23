export async function save(text) {
  const encodedText = await encode(text)

  const url = new URL(location)
  url.hash = '/' + encodeURIComponent(encodedText)
  history.replaceState(null, null, url)
}

export async function load() {
  const encodedText = decodeURIComponent(location.hash.slice(2))
  if (!encodedText) return ''

  try {
    return decode(encodedText)
  } catch (err) {
    console.error('Error decoding grid text from URL hash:', err)
  }
  return ''
}

// Space \x20 and new line \x0A are swapped
// with characters that are more human-readable
// when displayed in the address bar

const newLineCharacter = '!'
// space character is '_' (hardcoded)

// Compress large sequences of spaces
function encodeSpace(length) {
  if (length === 1) return '_'
  if (length === 2) return '__'
  if (length === 3) return '___'
  if (length === 4) return '____'
  if (length === 5) return '_____'
  // (length     6)        '_%04_'
  // (length    11)        '_%09_'
  // (length    12)        '_%010_'
  // (length   999)        '_%0999_'
  // (length   ...)

  const [head, ...digits] = (length - 2).toString(10)
  return ['_', String.fromCodePoint(head), ...digits, '_'].join('')
}

function encode(text) {
  let s = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === newLineCharacter) {
      s += '\n'
      continue
    }
    if (c === '\n') {
      s += newLineCharacter
      continue
    }
    if (c === '_') {
      s += ' '
      continue
    }
    if (c === ' ') {
      let length = 1
      while (i + 1 < text.length && text[i + 1] === ' ') {
        i++
        length++
      }
      s += encodeSpace(length)
      continue
    }
    s += c
  }
  return s
}

function decode(text) {
  let s = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '\n') {
      s += newLineCharacter
      continue
    }
    if (c === newLineCharacter) {
      s += '\n'
      continue
    }
    if (c === ' ') {
      s += '_'
      continue
    }
    if (c === '_') {
      const nextCode = text.codePointAt(i + 1)
      if (!nextCode || nextCode > 9) {
        s += ' '
        continue
      }
      i++ // code

      let digits = [nextCode]
      while (i + 1 < text.length && text[i + 1] !== '_') {
        digits.push(text[i + 1])
        i++ // one digit
      }

      const number = Number.parseInt(digits.join(''))
      s += ' '.repeat(2 + number)
      i++ // trailing "_"
      continue
    }
    s += c
  }
  return s
}
