import { useSubject } from '../../src/hooks/subject'
import { registerSinks } from '../../src/hooks/sinks'
import { useSources } from '../../src/hooks/sources'

export type Reducer<T> = (x: T) => T

export function useGlobalState<T>(initial: T) {
  const [reducer$, runReducer] = useSubject<Reducer<T>>()
  const state$ = useSources().state.stream

  registerSinks({
    state: reducer$.startWith((state) => {
      return state === undefined ? initial : state
    }),
  })

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
