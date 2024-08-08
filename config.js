import { signal } from '@preact/signals-core'

export const $language = signal('jp')

export const $fontType = signal('pop')

export const languages = {
  jp: {
    displayName: '日本語',
    displayCharacter: '日',
  },
  sc: {
    displayName: '简体中文',
    displayCharacter: '中',
  },
  tc: {
    displayName: '繁體中文',
    displayCharacter: '繁',
  },
  kr: {
    displayName: '한국어',
    displayCharacter: '한',
  },
}

export const fontTypes = {
  sans: {
    displayName: 'Sans',
  },
  serif: {
    displayName: 'Serif',
  },
  round: {
    displayName: 'Rounded',
  },
  pop: {
    displayName: 'Pop',
  },
  pen: {
    displayName: 'Pen',
  },
  brush: {
    displayName: 'Brush',
  },
  blob: {
    displayName: 'Blob',
  },
}
