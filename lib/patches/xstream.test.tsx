import './xstream'
import xs, { Stream } from 'xstream'
import { mockTimeSource } from '@cycle/time'
import { useContext, safeUseContext, runWithHandler } from '../context'

const CTX = Symbol('test-ctx')

test('provides sources over temporality (simple)', (done) => {
  const handler = { a: 'A' }
  const App = () => {
    return {
      a: xs
        .periodic(10)
        .take(1)
        .map(() => useContext(CTX)),
    }
  }
  const sinks = runWithHandler(CTX, handler, App)

  sinks.a.subscribe({
    next(val) {
      expect(val).toEqual(handler)
    },
    error(e) {
      throw e
    },
    complete() {
      done()
    },
  })
})

function testMethod(methodName: string, initObservable: () => Stream<any>) {
  test(`provides sources over temporality (${methodName})`, (done) => {
    const sources = { a: 'A' }
    const App = () => {
      return {
        a: initObservable().map(() => safeUseContext(CTX)),
      }
    }
    const sinks = runWithHandler(CTX, sources, () => App())

    var sub = sinks.a.subscribe({
      next(innerSources) {
        expect(innerSources).toEqual(sources)
        setTimeout(() => sub?.unsubscribe())
        done()
      },
      error(e) {
        throw e
      },
      complete() {
        done()
      },
    })
    setTimeout(() => {
      sub?.unsubscribe()
      throw 'Too long'
    }, 1000)
  })
}

type ToTest = { [P in keyof Stream<any> | string]?: () => Stream<any> }
const methodsTests: ToTest = {
  create: () =>
    xs.create({
      start(l) {
        setTimeout(() => l.next(''))
      },
      stop() {},
    }),

  createWithMemory: () =>
    xs.createWithMemory({
      start(l) {
        setTimeout(() => l.next(''))
      },
      stop() {},
    }),

  throw: () => xs.throw('error').replaceError(() => testStream()),
  from: () => xs.from(testStream()),
  of: () => xs.of(''),
  fromArray: () => xs.fromArray(['a', 'b']),
  fromPromise: () => xs.fromPromise(Promise.resolve('')),
  fromObservable: () => xs.fromObservable(xs.of('')),
  periodic: () => xs.periodic(10).take(1),
  merge: () => xs.merge(testStream(), testStream()),
  combine: () => xs.combine(testStream(), testStream()),
  compose: () => testStream().compose(() => testStream()),
  'create + push': () => {
    const stream = xs.create()
    setTimeout(() => {
      stream.shamefullySendNext('')
    })
    return stream
  },
  'Time.diagram': () => {
    const Time = mockTimeSource()
    setImmediate(() => {
      Time.run()
    })
    return Time.diagram('--x--')
  },
}

function testStream() {
  return xs.fromPromise(Promise.resolve(null))
}

Object.entries(methodsTests).forEach(([name, value]) => {
  testMethod(name, value)
})
