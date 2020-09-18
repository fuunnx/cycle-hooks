import { Stream } from 'xstream'
import { useSources } from '../context/sources'
import xs, { Listener, MemoryStream } from 'xstream'
import { Effect, EffectsSources } from './types'

let listener: Listener<Effect> | null = null
const effect$ = xs.create<Effect>({
  start(l) {
    listener = l
  },
  stop() {
    listener = null
  },
})

function triggerEffect(symbol: Symbol, value: unknown) {
  listener?.next([symbol, value])
}

export function makeSubject<T>(): [Stream<T>, (value: T) => void] {
  const stream$ = xs.create<T>()

  return [
    stream$,
    function next(value: T) {
      // TODO explore how to make it visualisable
      stream$.shamefullySendNext(value)
    },
  ]
}

export function makeMemorySubject<T>(
  initial: T,
): [MemoryStream<T>, (value: T) => void] {
  const [stream$, next] = makeSubject<T>()

  return [stream$.startWith(initial), next]
}

export function makeEffectsDriver(bus$ = effect$) {
  return function effectsDriver(sink$: Stream<() => void>) {
    sink$.subscribe({
      next: (x) => x(),
    })

    return bus$
  }
}
