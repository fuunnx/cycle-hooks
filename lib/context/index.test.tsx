import { runWithHandler, perform, EffectName } from './index'

const CTX: EffectName<() => number> = Symbol('test-ctx')

test('provides context 1 level deep', () => {
  const handler = () => 1
  const App = () => {
    let resolved = perform(CTX)
    expect(resolved).toEqual(handler())
    return {}
  }
  runWithHandler(CTX, handler, App)
})

test('cleans up after execution', () => {
  const handler = () => 1
  runWithHandler(CTX, handler, () => {})
  expect(() => perform(CTX)).toThrow()
})

test('context can be overriden', () => {
  const handler1 = () => 1
  const handler2 = () => 2
  const App = () => {
    let resolved = perform(CTX)
    expect(resolved).toEqual(handler1())
    runWithHandler(CTX, handler2, Component)
  }
  const Component = () => {
    let resolved = perform(CTX)
    expect(resolved).toEqual(handler2())
    return {}
  }

  runWithHandler(CTX, handler1, App)
})
