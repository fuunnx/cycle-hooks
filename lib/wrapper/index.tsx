import { sourcesKey } from '../hooks/sources'
import { refSymbol, Ref } from '../pragma/ref'
import { runWithHandlers } from '../context'
import { Sinks, Sources } from '../types'
import { gatherSinks } from '../hooks/sinks'
import { mergeSinks, streamify } from '../helpers'
import xs, { Stream } from 'xstream'
import { Reducer } from '@cycle/state'
import { trackChildren } from '../helpers/trackers/trackChildren'

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
        return runWithHandlers(
          {
            [sourcesKey as symbol]: sources,
            [refSymbol as symbol]: Ref(),
          },
          () => {
            const appSinks = App(sources)
            const normalizedSinks =
              typeof appSinks === 'object' && 'DOM' in appSinks
                ? appSinks
                : { DOM: streamify(appSinks) }

            normalizedSinks.DOM = trackChildren(
              normalizedSinks.DOM as Stream<any>,
            )
            return normalizedSinks as Sinks
          },
        )
      },
    )

    return {
      state: xs.empty(),
      ...mergeSinks([gathered, sinks]),
      DOM: sinks.DOM,
    }
  }
}
