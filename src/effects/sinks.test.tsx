import xs from 'xstream'
import { collectEffects, performEffects } from './sinks'
import { mockTimeSource } from '@cycle/time'
import { mergeSinks } from 'cyclejs-utils'

function assertSinksEqual(Time, actual, expected) {
  expect(Object.keys(expected).sort()).toEqual(Object.keys(actual).sort())
  Object.entries(expected).forEach(([key, value$]) => {
    Time.assertEqual(actual[key], value$)
  })
}

test('gather sinks 1 level deep', (done) => {
  const Time = mockTimeSource()
  const makeSinks = () => ({ a: Time.diagram('-x'), b: Time.diagram('-x') })
  function App() {
    performEffects(makeSinks())
    return {}
  }
  const [gathered] = collectEffects(['a', 'b'], () => App())
  assertSinksEqual(Time, gathered, makeSinks())

  Time.run(done)
})

test('gather sinks 2 levels deep', (done) => {
  const Time = mockTimeSource()
  const sinksA = () => ({ a: Time.diagram('-x'), b: Time.diagram('-x') })
  const sinksB = () => ({ a: Time.diagram('--x-x'), b: Time.diagram('-x') })
  function App() {
    performEffects(sinksA())
    Component()
    return {}
  }
  function Component() {
    performEffects(sinksB())
    return {}
  }

  const [gathered] = collectEffects(['a', 'b'], () => App())
  assertSinksEqual(Time, gathered, mergeSinks([sinksA(), sinksB()]))

  Time.run(done)
})

test('gather sinks inside streams', (done) => {
  const Time = mockTimeSource()
  const sinks = () => ({ d: Time.diagram('abcd') })
  const c$ = () => Time.diagram('--x--')
  function App() {
    return {
      c: c$().map(() => {
        performEffects(sinks())
        return 'y'
      }),
    }
  }

  const [gathered, appSinks] = collectEffects(['d'], () => App())
  assertSinksEqual(Time, mergeSinks([appSinks, gathered]), {
    d: Time.diagram('--abc'),
    c: c$().mapTo('y'),
  })

  Time.run(done)
})

test('stops gathered sinks on next', (done) => {
  const Time = mockTimeSource()

  const events = () => Time.diagram('---a-----b-----c')
  const repeatEvent = (char) => {
    return Time.diagram(String(char).repeat(10))
  }
  function App() {
    return {
      a: events().map((char) => {
        performEffects({
          b: repeatEvent(char),
        })
        return char
      }),
    }
  }

  const [gathered, appSinks] = collectEffects(['b'], () => App())
  assertSinksEqual(Time, gathered, {
    b: events().map(repeatEvent).flatten(),
  })
  assertSinksEqual(Time, appSinks, {
    a: events(),
  })

  Time.run(done)
})

test('stop gathered sinks on next (2)', (done) => {
  const events = () => xs.periodic(100).take(10)
  const repeatEvent = (char) => {
    return xs.periodic(20).mapTo(char).take(20)
  }
  function App() {
    return {
      a: events().map((char) => {
        performEffects({
          b: repeatEvent(char),
        })
        return char
      }),
    }
  }

  const [gathered, appSinks] = collectEffects(['b'], () => App())

  const actual = []
  const expected = []
  let completed = 0
  gathered.b.take(10).addListener({
    next(val) {
      actual.push(val)
    },
    complete() {
      completed += 1
      if (completed >= 2) {
        expect(actual).toEqual(expected)
        done()
      }
    },
  })
  events()
    .map(repeatEvent)
    .flatten()
    .take(10)
    .addListener({
      next(val) {
        expected.push(val)
      },
      complete() {
        completed += 1
        if (completed >= 2) {
          expect(actual).toEqual(expected)
          done()
        }
      },
    })

  appSinks.a.addListener({})
})

test('gather sinks inside streams, multiple times', (done) => {
  const Time = mockTimeSource()
  const sinksA = () => Time.diagram('-d-d')
  const sinksB = () => Time.diagram('--e-e')
  const c$ = () => Time.diagram('--x--')
  function App() {
    return {
      c: c$().map(() => {
        performEffects({ d: sinksA() })
        performEffects({ d: sinksB() })
        return 'y'
      }),
    }
  }

  const [gathered, appSinks] = collectEffects(['d'], () => App())
  assertSinksEqual(Time, mergeSinks([appSinks, gathered]), {
    d: c$()
      .map(() => xs.merge(sinksA(), sinksB()))
      .flatten(),
    c: c$().mapTo('y'),
  })

  Time.run(done)
})
