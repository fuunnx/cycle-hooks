import { registerSinks } from './sinks'
import { useSubject } from '../helpers/subjects'

// TODO needs proper typings
export function useLogger() {
  const [event$, log] = useSubject()

  registerSinks({
    Log: event$,
  })

  return log
}
