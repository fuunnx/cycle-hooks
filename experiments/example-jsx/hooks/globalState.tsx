import { useSubject } from '../../src/hooks/subject'
import { performEffects } from '../../../src/effects/sinks'
import { useSources } from '../../../src/effects/sources'
import xs from 'xstream'

export type Reducer<T> = (x: T) => T

export function useGlobalState<T>(initial: T) {
  const [reducer$, runReducer] = useSubject<Reducer<T>>()
  const state$ = useSources().state.stream

  performEffects({
    state: reducer$.startWith((state) => {
      return state === undefined ? initial : state
    }),
    log: xs.of('hellor !'),
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
