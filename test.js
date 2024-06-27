import { test2 } from './test2.js'

console.log('test.js')

let x = 1

test('a')

console.log('b?')

export function test(name) {
  console.log('test:', name, test2(x++))
  console.log('test:', name, test2(x++))
  console.log('test:', name, test2(x++))
}

export function join(...xs) {
  return xs.join('/')
}

test('z')
