import { performEffects } from '../../src/effects/sinks'
import { useSubject } from '../../src/hooks/subject'

// TODO needs proper typings
export function useLogger() {
  const [event$, log] = useSubject()

  performEffects({
    Log: event$,
  })

  return log
}
