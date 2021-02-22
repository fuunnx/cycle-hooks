import { bindSources } from '../effects/sources'
import { AnySinks, AnySources, Main } from '../types'
import { collectEffects } from '../effects/sinks'
import { mergeSinks } from 'cyclejs-utils'

export function withEffects<So extends AnySources, Si extends AnySinks>(
  App: () => Partial<Si>,
): Main<So, Si>
export function withEffects<So extends AnySources, Si extends AnySinks>(
  effectsNames: string[],
  App: () => Partial<Si>,
): Main<So, Si>
export function withEffects<So extends AnySources, Si extends AnySinks>(
  ...args: [any] | [any, any]
): Main<So, Si> {
  let App: () => Si
  let effectsNames: string[] = []

  if (args.length === 2) {
    ;[effectsNames, App] = args
  }
  if (args.length === 1) {
    ;[App] = args
  }

  return function AppWithEffects(sources: AnySources): Si {
    const [appEffects, appSinks] = collectEffects(
      [...effectsNames, ...Object.keys(sources)],
      bindSources(sources, App),
    )

    return mergeSinks([appEffects, appSinks], {
      DOM: () => appSinks.DOM,
    }) as Si
  }
}
