import { join, test } from './test.js'

await new Promise((resolve) => setTimeout(resolve, 1000))
console.log('test2.js')

// test('あ')

export function test2(x) {
  return join('test2', x, '!')
}

// test('そ')
