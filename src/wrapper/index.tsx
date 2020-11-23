import { readSourcesEffect } from '../hooks/sources'
import { Ref, readRefEffect } from './ref'
import { Sinks, Sources } from '../types'
import { gatherSinks } from '../hooks/sinks'
import { mergeSinks } from '../libs/mergeSinks'
import { Stream } from 'xstream'
import { mountInstances } from './mountInstances'
import { withHandler } from 'performative-ts'
import { mountEventListeners } from './mountEventListeners'
import { streamify } from '../libs/isObservable'
import { Component } from '../pragma/types'

export function withHooks<Si extends Sinks>(
  App: Component,
  sinksNames: string[] = [],
): (sources: Sources) => Si {
  return function AppWithHooks(sources: Sources): Si {
    const [gathered, sinks] = gatherSinks(
      [...sinksNames, ...Object.keys(sources)],
      () => {
        const ref = Ref()

        return withHandler(
          [readSourcesEffect, () => sources],
          [readRefEffect, () => ref],
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
