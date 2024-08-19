# BUGS

- the scrollbar/view glitches
  REPRO (untested)
  - new document
  - insert content at 500,500
  - pan

# Vertical text

Some characters need to be adjusted when in vertical writing mode: →「（、。ー
Some of these have a "vertical" unicode variant: ↓﹁︵︐︒
Others don't.
Some of these characters can be rendered into vertical mode using CSS `writing-mode: vertical-rl' if the font supports it.
Note that when both (unicode variant and css) are applicable, the result may still differ.
Note that CJK characters such as な虫 don't need to be rotated but setting writing-mode on them does affect their em alignment. For example, the katana "long vowel mark" ー, when rendered vertically using `writing-mode` is rotated into a vertical dash, but this vertical dash will only align with e.g. the vertical stem of 木 if`writing-mode` is also applied to the kanji.

In Chinese (simplified), some punctuation characters are left-aligned in horizontal text and right-aligned in vertical text: ：！？

# Fonts

We want to support the following languages: Japanese, Chinese, Korean. First off, Chinese has 3 main regional variants: simplified, traditional (Taiwan) and traditional (Hong Kong). These languages feature unique characters, but the majority of characters that they use are shared with the other languages. Some of these shared characters are drawn differently depending on the language.

Most fonts target a single language. These are not suitable for the other languages, as many (common) characters are missing and will be displayed in a fallback font.

Some fonts are designed for multiple language targets. They are packaged either as a single font file leveraging OpenType Glyph Substitution and language tagging (some characters have variant glyphs), or as a collection of font files, each able to render every language but favoring the style of one language, or as a collection of font files containing only the characters of one language.

## Default font (sans-serif)

It is assumed that the user's browser or system is capable of rendering any CJK character in sans-serif font(s), and will use the `lang` attribute to determine which regional variants of characters to use.

## Free font resources:

Always check the license

### Google Fonts

Few Chinese fonts

### Japanese

https://free-fonts.jp/category/comic/

### Chinese

https://www.freechinesefont.com/
https://wordshub.github.io/free-font/font.html?QingSongShouXieTiYi_Regular

### Korean

https://www.sandollcloud.com/freefonts

## Font styles

Sans: Noto Sans CJK, Inconsolata (sans mono)
Serif: Noto Serif CJK, Libertinus (serif mono)
Handwritten: Seto, Xiaolai // supports LAT, JP, CN, KO // ugly // TODO: subset
Pop: Hachi Maru Pop // JP, CN // TODO: hangul
Brush: Yuji Syuku (JP), Ma Shan Zheng (CN), Recursive (LAT) // TODO: hangul
Rounded: Comfortaa 350, Zen Maru Gothic (JP), // TODO: chinese, hangul
Cursive: ??, Monaspace Radon
Pixel: ??, ??
Blobby: ??, Gluten
??: M_PLUS_Rounded_1c, M_PLUS_Code_Latin

Script candidates (Latin):

- Hachi Maru Pop // kanji, kana // reaaally good
- Gluten // very round, variable weight // blobby good
- Rock Salt // small caps, textured // could work with at a smaller size
- https://www.recursive.design/ // slab cursive

- Yuji Boku (the latin part) // not wide but looks nice

Candidates (Japanese):

- sans

  - Noto
  - IBM Plex (JP, KR, TC, soon SC)
  - Zen Kaku Gothic New // no feet

- mincho

  - Zen Kaku Mincho
  - Zen Antique (Soft)
  - Kaisei Decol // has rounded tips, unique
    Kaisei (...) are different in kana only

- brush

  - Yuji Syuku // JP
  - Ma Shan Zheng // CN

- handwritten

  - Zen Kurenaido // messy
  - Yomogi // clean // limited kanji
  - fontworks/Klee (One) // minchou
  - seto // childish // thick, i don't like
    keso / xiaolai // chinese version
  - lxgw/yozai-font // chinese, based on jp?
  - jasonhandwriting // chinese
  - Ebihara No Kuseji // JP, very limited // thin, i like

  (chinese)

  - jasonhandwriting // on github, SIL

- display

  - fontworks/rocknroll

- maru

  - moji-waku/Mamelon / Kiwi Maru (light) // slightly rounded
  - Zen Maru Gothic // very rounded, thin
  - Kosugi maru // thick

- marker

  - Yusei Magic // JP
  - Tanuki Permanent Marker // JP

- abstract
  - ZCOOL QingKe HuangYou // chinese

Chinese:

- LXGW WenKai // sans cursive // CN/KR/JP // broken cmap?
- justfont/open-huninn-font // Taiwan extension of Kosugi Maru // no SC
- LXGW/kose xiaolai // Chinese extension of Seto
- LXGW/FusionKai // Chinese extension of Klee One (and others)

Traditional Chinese (Taiwan)

- Han Wang: Yen Light(Maru), Yan Kai (Brush)
  https://www.freechinesefont.com/?s=han+wang
- cwTeX fonts: Kai, FangSong, Yuan (rounded)
  https://www.freechinesefont.com/?s=cwtex

Wide monospace fonts:

- Inconsolata // 200
- League Mono // 200
- Iosevka // 125
- Monaspace // 125
- MPlus Code Latin // Rounded but still squarish look
- Fantasque // A bit funky
- Cousine // Small caps

- Azeret Mono // OK // only 1 weight
- Sometype Mono // Small letters // increase weight

Monospace + Slab

- PT Mono
- Go Mono
- GNU Free Font
- Drafting Mono

Monospace + Serif ?

- [PAID] Century Schoolbook Mono
- [PAID] Right Serif Mono // good but not wide
- Libertinus Mono // https://github.com/alerque/libertinus/releases
-

Monospace: other

- [PAID] Panoptica // looks intersting
- [PAID] NorB TypeWrite // looks line Monaspace Radon

Pixel fonts?

- JF Dot MPlus 12 // JP
- Ark Pixel 12 // JP
- Zpix Pixel 12 // CN, JP, EN
- Cubic 11 // CN but based on M+?
- Fusion Pixel Font 8/10/12 // CN S/T, JP, KO (check?)
  // mix of existing fonts (Ark 10/12, ..., Cubic 11)
