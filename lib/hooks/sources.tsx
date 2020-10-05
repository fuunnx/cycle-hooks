import '../patches/xstream'

import { Sources } from '../types'
import {
  EffectName,
  runWithHandler,
  useContext,
  safeUseContext,
} from '../context'

export const sourcesKey: EffectName<Sources> = Symbol('sources')

export function provideSources<T>(
  sources: Sources | ((sources: Sources) => Sources),
  func: () => T,
) {
  if (typeof sources === 'function') {
    return runWithHandler(sourcesKey, sources(useSources()), func)
  }

  return runWithHandler(sourcesKey, sources, func)
}

export function useSources() {
  return useContext(sourcesKey)
}

export function safeUseSources() {
  return safeUseContext(sourcesKey)
}
