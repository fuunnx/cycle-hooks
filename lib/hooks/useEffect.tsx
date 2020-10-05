import { Stream } from 'xstream'
import { registerSinks } from './sinks'

export function useEffect(effect$: Stream<() => void>) {
  return registerSinks({
    effects: effect$,
  })
}
