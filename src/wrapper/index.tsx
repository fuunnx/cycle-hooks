import { readSourcesEffect } from '../hooks/sources'
import { Ref, readRefEffect } from '../pragma/ref'
import { Sinks, Sources } from '../types'
import { gatherSinks } from '../hooks/sinks'
import { mergeSinks } from '../helpers'
import { Stream } from 'xstream'
import { trackChildren } from '../helpers/trackers/trackChildren'
import { withHandler } from 'performative-ts'

export function withHooks<Si extends Sinks>(
  App: (sources: Sources) => Partial<Sinks>,
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
            const appSinks = App(sources)

            return {
              ...appSinks,
              DOM: trackChildren(appSinks.DOM as Stream<any>),
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
