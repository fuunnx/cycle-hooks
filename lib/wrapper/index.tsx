import { readSourcesEffect } from '../hooks/sources'
import { Ref, readRefEffect } from '../pragma/ref'
import { Sinks, Sources } from '../types'
import { gatherSinks } from '../hooks/sinks'
import { mergeSinks } from '../helpers'
import xs, { Stream } from 'xstream'
import { Reducer } from '@cycle/state'
import { trackChildren } from '../helpers/trackers/trackChildren'
import { withHandler } from 'performative-ts'

type AppSinks = Sinks & {
  state: Stream<Reducer<unknown>>
}

export function withHooks<Props>(
  App: (sources: Sources) => Partial<AppSinks>,
  sinksNames: string[] = [],
): (sources: Sources) => AppSinks {
  return function AppWithHooks(
    sources: Sources & { props$: Stream<Props> },
  ): AppSinks {
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

    return {
      state: xs.empty(), // for typings
      ...mergeSinks([gathered, sinks]),
      DOM: sinks.DOM,
    }
  }
}
