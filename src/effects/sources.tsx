import '../patches/xstream'

import { AnyFunction, AnySources } from '../types'
import { EffectName, withHandler, bindHandler, perform } from 'performative-ts'

export const useSourcesSymbol: EffectName<() => AnySources> = Symbol(
  'useSources',
)

export function withSources<T>(
  sources: AnySources | ((sources: AnySources) => AnySources),
  func: () => T,
) {
  if (typeof sources === 'function') {
    return withHandler([useSourcesSymbol, () => sources(useSources())], func)
  }

  return withHandler([useSourcesSymbol, () => sources], func)
}

export function bindSources<T extends AnyFunction>(
  sources: AnySources | ((sources: AnySources) => AnySources),
  func: T,
) {
  if (typeof sources === 'function') {
    return bindHandler([useSourcesSymbol, () => sources(useSources())], func)
  }

  return bindHandler([useSourcesSymbol, () => sources], func)
}

export function useSources<So extends AnySources>(): So {
  return perform(useSourcesSymbol) as So
}
