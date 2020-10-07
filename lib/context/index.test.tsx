import { runWithHandler, useContext } from './index'

const CTX = Symbol('test-ctx')

test('provides context 1 level deep', () => {
  const handler = { a: 'a' }
  const App = () => {
    let resolved = useContext(CTX)
    expect(resolved).toEqual(handler)
    return {}
  }
  runWithHandler(CTX, handler, App)
})

test('cleans up after execution', () => {
  const handler = { a: 'a' }
  runWithHandler(CTX, handler, () => {})
  expect(() => useContext(CTX)).toThrow()
})

test('context can be overriden', () => {
  const handler1 = { a: 'a' }
  const handler2 = { b: 'b' }
  const App = () => {
    let resolved = useContext(CTX)
    expect(resolved).toEqual(handler1)
    runWithHandler(CTX, handler2, Component)
  }
  const Component = () => {
    let resolved = useContext(CTX)
    expect(resolved).toEqual(handler2)
    return {}
  }

  runWithHandler(CTX, handler1, App)
})
