export function isFullWidth(character) {
  let x = character.charCodeAt(0)
  let y = character.length === 2 ? character.charCodeAt(1) : 0
  if (0xd800 <= x && x <= 0xdbff && 0xdc00 <= y && y <= 0xdfff) {
    x &= 0x3ff
    y &= 0x3ff
    x = (x << 10) | y
    x += 0x10000
  }

  // ASCII, early return false
  if (x <= 0x007f) return false

  // Full-width: space, latin, punctuation, currency
  if (
    0x3000 === x ||
    (0xff01 <= x && x <= 0xff60) ||
    (0xffe0 <= x && x <= 0xffe6)
  )
    return true

  // Wide
  return (
    (x >= 0x1100 && x <= 0x115f) ||
    x === 0x231a ||
    x === 0x231b ||
    x === 0x2329 ||
    x === 0x232a ||
    (x >= 0x23e9 && x <= 0x23ec) ||
    x === 0x23f0 ||
    x === 0x23f3 ||
    x === 0x25fd ||
    x === 0x25fe ||
    x === 0x2614 ||
    x === 0x2615 ||
    (x >= 0x2648 && x <= 0x2653) ||
    x === 0x267f ||
    x === 0x2693 ||
    x === 0x26a1 ||
    x === 0x26aa ||
    x === 0x26ab ||
    x === 0x26bd ||
    x === 0x26be ||
    x === 0x26c4 ||
    x === 0x26c5 ||
    x === 0x26ce ||
    x === 0x26d4 ||
    x === 0x26ea ||
    x === 0x26f2 ||
    x === 0x26f3 ||
    x === 0x26f5 ||
    x === 0x26fa ||
    x === 0x26fd ||
    x === 0x2705 ||
    x === 0x270a ||
    x === 0x270b ||
    x === 0x2728 ||
    x === 0x274c ||
    x === 0x274e ||
    (x >= 0x2753 && x <= 0x2755) ||
    x === 0x2757 ||
    (x >= 0x2795 && x <= 0x2797) ||
    x === 0x27b0 ||
    x === 0x27bf ||
    x === 0x2b1b ||
    x === 0x2b1c ||
    x === 0x2b50 ||
    x === 0x2b55 ||
    (x >= 0x2e80 && x <= 0x2e99) ||
    (x >= 0x2e9b && x <= 0x2ef3) ||
    (x >= 0x2f00 && x <= 0x2fd5) ||
    (x >= 0x2ff0 && x <= 0x2fff) ||
    (x >= 0x3001 && x <= 0x303e) ||
    (x >= 0x3041 && x <= 0x3096) ||
    (x >= 0x3099 && x <= 0x30ff) ||
    (x >= 0x3105 && x <= 0x312f) ||
    (x >= 0x3131 && x <= 0x318e) ||
    (x >= 0x3190 && x <= 0x31e3) ||
    (x >= 0x31ef && x <= 0x321e) ||
    (x >= 0x3220 && x <= 0x3247) ||
    (x >= 0x3250 && x <= 0x4dbf) ||
    (x >= 0x4e00 && x <= 0xa48c) ||
    (x >= 0xa490 && x <= 0xa4c6) ||
    (x >= 0xa960 && x <= 0xa97c) ||
    (x >= 0xac00 && x <= 0xd7a3) ||
    (x >= 0xf900 && x <= 0xfaff) ||
    (x >= 0xfe10 && x <= 0xfe19) ||
    (x >= 0xfe30 && x <= 0xfe52) ||
    (x >= 0xfe54 && x <= 0xfe66) ||
    (x >= 0xfe68 && x <= 0xfe6b) ||
    (x >= 0x16fe0 && x <= 0x16fe4) ||
    x === 0x16ff0 ||
    x === 0x16ff1 ||
    (x >= 0x17000 && x <= 0x187f7) ||
    (x >= 0x18800 && x <= 0x18cd5) ||
    (x >= 0x18d00 && x <= 0x18d08) ||
    (x >= 0x1aff0 && x <= 0x1aff3) ||
    (x >= 0x1aff5 && x <= 0x1affb) ||
    x === 0x1affd ||
    x === 0x1affe ||
    (x >= 0x1b000 && x <= 0x1b122) ||
    x === 0x1b132 ||
    (x >= 0x1b150 && x <= 0x1b152) ||
    x === 0x1b155 ||
    (x >= 0x1b164 && x <= 0x1b167) ||
    (x >= 0x1b170 && x <= 0x1b2fb) ||
    x === 0x1f004 ||
    x === 0x1f0cf ||
    x === 0x1f18e ||
    (x >= 0x1f191 && x <= 0x1f19a) ||
    (x >= 0x1f200 && x <= 0x1f202) ||
    (x >= 0x1f210 && x <= 0x1f23b) ||
    (x >= 0x1f240 && x <= 0x1f248) ||
    x === 0x1f250 ||
    x === 0x1f251 ||
    (x >= 0x1f260 && x <= 0x1f265) ||
    (x >= 0x1f300 && x <= 0x1f320) ||
    (x >= 0x1f32d && x <= 0x1f335) ||
    (x >= 0x1f337 && x <= 0x1f37c) ||
    (x >= 0x1f37e && x <= 0x1f393) ||
    (x >= 0x1f3a0 && x <= 0x1f3ca) ||
    (x >= 0x1f3cf && x <= 0x1f3d3) ||
    (x >= 0x1f3e0 && x <= 0x1f3f0) ||
    x === 0x1f3f4 ||
    (x >= 0x1f3f8 && x <= 0x1f43e) ||
    x === 0x1f440 ||
    (x >= 0x1f442 && x <= 0x1f4fc) ||
    (x >= 0x1f4ff && x <= 0x1f53d) ||
    (x >= 0x1f54b && x <= 0x1f54e) ||
    (x >= 0x1f550 && x <= 0x1f567) ||
    x === 0x1f57a ||
    x === 0x1f595 ||
    x === 0x1f596 ||
    x === 0x1f5a4 ||
    (x >= 0x1f5fb && x <= 0x1f64f) ||
    (x >= 0x1f680 && x <= 0x1f6c5) ||
    x === 0x1f6cc ||
    (x >= 0x1f6d0 && x <= 0x1f6d2) ||
    (x >= 0x1f6d5 && x <= 0x1f6d7) ||
    (x >= 0x1f6dc && x <= 0x1f6df) ||
    x === 0x1f6eb ||
    x === 0x1f6ec ||
    (x >= 0x1f6f4 && x <= 0x1f6fc) ||
    (x >= 0x1f7e0 && x <= 0x1f7eb) ||
    x === 0x1f7f0 ||
    (x >= 0x1f90c && x <= 0x1f93a) ||
    (x >= 0x1f93c && x <= 0x1f945) ||
    (x >= 0x1f947 && x <= 0x1f9ff) ||
    (x >= 0x1fa70 && x <= 0x1fa7c) ||
    (x >= 0x1fa80 && x <= 0x1fa88) ||
    (x >= 0x1fa90 && x <= 0x1fabd) ||
    (x >= 0x1fabf && x <= 0x1fac5) ||
    (x >= 0x1face && x <= 0x1fadb) ||
    (x >= 0x1fae0 && x <= 0x1fae8) ||
    (x >= 0x1faf0 && x <= 0x1faf8) ||
    (x >= 0x20000 && x <= 0x2fffd) ||
    (x >= 0x30000 && x <= 0x3fffd)
  )
}

window.isFullWidth = isFullWidth
