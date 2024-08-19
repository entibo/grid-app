import { signal } from '@preact/signals-core'

export const $language = signal('jp')

export const $fontType = signal('sans')

export const languages = {
  jp: {
    displayName: '日本語',
    displayCharacter: '日',
    lang: 'ja',
  },
  sc: {
    displayName: '简体中文',
    displayCharacter: '中',
    lang: 'zh-Hans',
  },
  // tc: {
  //   displayName: '繁體中文(臺灣)',
  //   displayCharacter: '繁',
  //   lang: 'zh-Hant',
  // },
  tw: {
    displayName: '繁體中文(臺灣)',
    displayCharacter: '臺',
    lang: 'zh-TW',
  },
  hk: {
    displayName: '繁體中文(香港)',
    displayCharacter: '香',
    lang: 'zh-HK',
  },
  kr: {
    displayName: '한국어',
    displayCharacter: '한',
    lang: 'ko',
  },
}

export const fontTypes = {
  sans: {
    displayName: 'Sans',
  },
  square: {
    displayName: 'Square',
  },
  serif: {
    displayName: 'Serif',
  },
  round: {
    displayName: 'Round',
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
  plus: {
    displayName: 'M+',
  },
}
