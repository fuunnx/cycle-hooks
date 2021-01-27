import { useSourcesSymbol } from '../hooks/sources'
import { Instance, getInstanceSymbol } from './instance'
import { Sinks, Sources } from '../types'
import { collectEffects } from '../hooks/sinks'
import { mergeSinks } from '../libs/mergeSinks'
import { Stream } from 'xstream'
import { mountInstances } from './mountInstances'
import { withHandler } from 'performative-ts'
import { mountEventListeners } from './mountEventListeners'
import { streamify } from '../libs/isObservable'
import { Component } from '../jsx/types'

export function withHooks<Si extends Sinks>(
  App: Component,
  sinksNames: string[] = [],
): (sources: Sources) => Si {
  return function AppWithHooks(sources: Sources): Si {
    const [gathered, sinks] = collectEffects(
      [...sinksNames, ...Object.keys(sources)],
      () => {
        const instance = Instance()

        return withHandler(
          [useSourcesSymbol, () => sources],
          [getInstanceSymbol, () => instance],
          () => {
            const result = App()
            const appSinks = ((result as any).DOM
              ? result
              : { DOM: streamify(result) }) as Sinks

            return {
              ...appSinks,
              DOM: (appSinks.DOM as Stream<any>)
                .compose(mountEventListeners)
                .compose(mountInstances),
            }
          },
        )
      },
    )

    return ({
      ...mergeSinks([gathered, sinks]),
      DOM: sinks.DOM,
    } as unknown) as Si
  }
}
