import '../patches/xstream'

import { Sources } from '../types'
import { EffectName, withHandler, perform } from 'performative-ts'

export const useSourcesSymbol: EffectName<() => Sources> = Symbol('useSources')

export function withSources<T>(
  sources: Sources | ((sources: Sources) => Sources),
  func: () => T,
) {
  if (typeof sources === 'function') {
    const newSources = sources(useSources())
    return withHandler([useSourcesSymbol, () => newSources], func)
  }

  return withHandler([useSourcesSymbol, () => sources], func)
}

export function useSources<So extends Sources>(): So {
  return perform(useSourcesSymbol) as So
}
