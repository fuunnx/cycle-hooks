import '../patches/xstream'

import { Sources } from '../types'
import {
  EffectName,
  withHandler,
  perform,
  performOrFailSilently,
} from 'performative-ts'

export const readSourcesEffect: EffectName<() => Sources> = Symbol('sources')

export function withSources<T>(
  sources: Sources | ((sources: Sources) => Sources),
  func: () => T,
) {
  if (typeof sources === 'function') {
    const newSources = sources(useSources())
    return withHandler([readSourcesEffect, () => newSources], func)
  }

  return withHandler([readSourcesEffect, () => sources], func)
}

export function useSources<So extends Sources>(): So {
  return perform(readSourcesEffect) as So
}

export function safeUseSources<So extends Sources>(): So {
  return performOrFailSilently(readSourcesEffect) as So
}
