import { useSubject } from '../../src/hooks/subject'
import xs, { Stream } from 'xstream'

export type Reducer<T> = (x: T) => T

export function useState<T>(sourceReducer$: Stream<Reducer<T>>, initial: T)
export function useState<T>(initial: T)
export function useState<T>(...args: any[]) {
  let sourceReducer$: Stream<Reducer<T>>
  let initial: T

  if (args.length === 2) {
    ;[sourceReducer$, initial] = args
  } else {
    ;[initial] = args
  }

  const [innerReducer$, runReducer] = useSubject<Reducer<T>>()
  const reducer$ = sourceReducer$
    ? xs.merge(sourceReducer$, innerReducer$)
    : innerReducer$
  const state$ = reducer$.fold((acc, reducer) => reducer(acc), initial)

  return [
    state$,
    function setState(val: Reducer<T> | T | Partial<T>) {
      if (typeof val === 'function') {
        return runReducer(val as Reducer<T>)
      }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return runReducer((old) => ({
          ...old,
          ...val,
        }))
      }
      return runReducer(() => val as T)
    },
  ] as const
}
