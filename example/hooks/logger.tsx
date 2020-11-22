import { registerSinks } from '../../src/hooks/sinks'
import { useSubject } from '../../src/hooks/subject'

// TODO needs proper typings
export function useLogger() {
  const [event$, log] = useSubject()

  registerSinks({
    Log: event$,
  })

  return log
}
