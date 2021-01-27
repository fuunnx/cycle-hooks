import '../patches/xstream'

import { AnySources } from '../types'
import { EffectName, withHandler, perform } from 'performative-ts'

export const useSourcesSymbol: EffectName<() => AnySources> = Symbol(
  'useSources',
)

export function withSources<T>(
  sources: AnySources | ((sources: AnySources) => AnySources),
  func: () => T,
) {
  if (typeof sources === 'function') {
    const newSources = sources(useSources())
    return withHandler([useSourcesSymbol, () => newSources], func)
  }

  return withHandler([useSourcesSymbol, () => sources], func)
}

export function useSources<So extends AnySources>(): So {
  return perform(useSourcesSymbol) as So
}
