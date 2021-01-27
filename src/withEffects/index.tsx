import { withSources } from '../effects/sources'
import { AnySinks, AnySources, MainFn } from '../types'
import { collectEffects } from '../effects/sinks'
import { mergeSinks } from '../libs/mergeSinks'

export function withEffects<So extends AnySources, Si extends AnySinks>(
  App: () => Partial<Si>,
): MainFn<So, Si>
export function withEffects<So extends AnySources, Si extends AnySinks>(
  effectsNames: string[],
  App: () => Partial<Si>,
): MainFn<So, Si>
export function withEffects<So extends AnySources, Si extends AnySinks>(
  ...args: [any] | [any, any]
): MainFn<So, Si> {
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
      () => {
        return withSources(sources, () => {
          return App()
        })
      },
    )

    return mergeSinks([appEffects, appSinks], {
      DOM: () => appSinks.DOM,
    }) as Si
  }
}
