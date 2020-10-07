import '../patches/xstream'

import { Sources } from '../types'
import { EffectName, runWithHandler, perform, performSafe } from '../context'

export const readSourcesEffect: EffectName<() => Sources> = Symbol('sources')

export function provideSources<T>(
  sources: Sources | ((sources: Sources) => Sources),
  func: () => T,
) {
  if (typeof sources === 'function') {
    return runWithHandler(readSourcesEffect, sources(useSources()), func)
  }

  return runWithHandler(readSourcesEffect, () => sources, func)
}

export function useSources() {
  return perform(readSourcesEffect)
}

export function safeUseSources() {
  return performSafe(readSourcesEffect)
}
