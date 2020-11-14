import '../patches/xstream'

import { Sources } from '../types'
import {
  EffectName,
  withHandler,
  perform,
  performOrFailSilently,
} from 'performative-ts'

export const readSourcesEffect: EffectName<() => Sources> = Symbol('sources')

export function provideSources<T>(
  sources: Sources | ((sources: Sources) => Sources),
  func: () => T,
) {
  if (typeof sources === 'function') {
    return withHandler([readSourcesEffect, sources(useSources())], func)
  }

  return withHandler([readSourcesEffect, () => sources], func)
}

export function useSources() {
  return perform(readSourcesEffect)
}

export function safeUseSources() {
  return performOrFailSilently(readSourcesEffect)
}
