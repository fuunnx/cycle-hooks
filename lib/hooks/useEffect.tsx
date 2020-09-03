import { Stream } from 'xstream'
import { registerSinks } from '../context/sinks'

export function useEffect(effect$: Stream<() => void>) {
  return registerSinks({
    effects: effect$,
  })
}
