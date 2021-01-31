import xs, { Stream } from 'xstream'

export type Reducer<T> = (x: T) => T

type SetState<T> = (val: Reducer<T> | T | Partial<T>) => void

export function stateReducer<T>(
  reducer$: Stream<Reducer<T> | T | Partial<T>>,
  initial: T,
): Stream<T>
export function stateReducer<T>(initial: T): Stream<T>
export function stateReducer<T>(...args: any[]): Stream<T> {
  let reducer$: Stream<Reducer<T>>
  let initial: T

  if (args.length === 2) {
    ;[reducer$, initial] = args
  } else {
    ;[initial] = args
  }

  const state$ = reducer$
    .map(transformReducers)
    .fold((acc, reducer) => reducer(acc), initial)

  return state$
}

export function transformReducers<T>(val: Reducer<T> | T | Partial<T>) {
  if (typeof val === 'function') {
    return val as Reducer<T>
  }

  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return (old) => ({
      ...old,
      ...val,
    })
  }

  return () => val as T
}
