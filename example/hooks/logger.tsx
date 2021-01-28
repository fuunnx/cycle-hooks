import xs from 'xstream'
import { performEffects } from '../../src/effects/sinks'

export function log(value: any) {
  performEffects({
    Log: xs.of(value),
  })

  return value
}
