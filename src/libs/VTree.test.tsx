import { assocChild, assocVTree, TextNode } from './VTree'
import { h } from '@cycle/dom'

test('assocChild pushes value to children if no children', () => {
  expect(assocChild(0, 'Value', h('div'))).toEqual(h('div', ['Value']))
})

test('assocChild works even if bad index', () => {
  expect(assocChild(1, 'Value', h('div'))).toEqual(h('div', ['Value']))
})

test('assocChild replaces existing Vnode children at provided index', () => {
  expect(assocChild(1, 'Value', h('div', [0, 1, 2]))).toEqual(
    h('div', [0, 'Value', 2]),
  )
})
test('assocChild works with arrays', () => {
  expect(assocChild(1, 'Value', [0, 1, 2])).toEqual([0, TextNode('Value'), 2])
})

test('assocVTree replaces existing Vnode children at provided indexes (simple)', () => {
  expect(assocVTree([1], 'Value', h('div', [0, 1, 2]))).toEqual(
    h('div', [0, 'Value', 2]),
  )
})

test('assocVTree works with complex paths', () => {
  expect(assocVTree([1, 0], 'Value', h('div', [0, h('div', []), 2]))).toEqual(
    h('div', [0, h('div', ['Value']), 2]),
  )
})

test('assocVTree works with arrays', () => {
  expect(assocVTree([1, 0], 'Value', [0, h('div', []), 2])).toEqual([
    0,
    h('div', ['Value']),
    2,
  ])
})
