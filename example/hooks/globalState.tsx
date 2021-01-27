import { performEffects } from '../../src/effects/sinks'
import { useSources } from '../../src/effects/sources'
import xs, { Stream } from 'xstream'
import { StateSource } from '@cycle/state'

export type Reducer<T> = (x: T) => T

export function useGlobalState<T>(reducer$: Stream<Reducer<T>> = xs.empty()) {
  const { state } = useSources<{ state: StateSource<T> }>()

  if (!state) {
    throw new Error('Expected `state` source, got undefined')
  }

  performEffects({
    state: reducer$,
  })

  return state.stream
}
