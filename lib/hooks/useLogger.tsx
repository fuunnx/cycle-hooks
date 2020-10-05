import { registerSinks } from '../hooks/sinks'
import { useSubject } from '../helpers/subjects'

// TODO needs proper typings
export function useLogger() {
  const [event$, log] = useSubject()

  registerSinks({
    Log: event$,
  })

  return log
}
