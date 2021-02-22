import { p } from '@cycle/dom'
import { mockTimeSource } from '@cycle/time'
import { mergeSinks } from 'cyclejs-utils'
import { createElement } from '.'
import { collectEffects, performEffects } from '../../src/effects/sinks'
import { withSources } from '../../src/effects/sources'
import { mountInstances } from './mountInstances'

function assertSinksEqual(Time, actual, expected) {
  expect(Object.keys(expected).sort()).toEqual(Object.keys(actual).sort())
  Object.entries(expected).forEach(([key, value$]) => {
    Time.assertEqual(actual[key], value$)
  })
}

test('gather components sinks', (done) => {
  const Time = mockTimeSource()

  function wrap(func) {
    return collectEffects(['test'], () => {
      return withSources({}, () => mountInstances(func()))
    })
  }

  function App() {
    return Time.diagram('x').map(() => <Child />)
  }

  function Child() {
    performEffects({
      test: Time.diagram('--x'),
    })
    return Time.diagram('--x').map(() => p(['Child']))
  }

  const [gathered, appSinks] = wrap(() => App())
  assertSinksEqual(Time, mergeSinks([{ DOM: appSinks }, gathered]), {
    DOM: Time.diagram('--x').map(() => p(['Child'])),
    test: Time.diagram('--x'),
  })

  Time.run(done)
})
