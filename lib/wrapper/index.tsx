import { sourcesKey } from '../context/sources'
import { refSymbol, Ref } from '../pragma/ref'
import { withContext } from '../context'
import { Sinks, Sources } from '../types'
import { gatherSinks } from '../context/sinks'
import { mergeSinks } from '../helpers'
import xs, { MemoryStream, Stream } from 'xstream'
import { Reducer } from '@cycle/state'
import { trackChildren } from '../pragma'

type AppSinks = Sinks & {
  state: Stream<Reducer<unknown>>
}

export function withHooks(
  App: (sources?: Sources) => Sinks | MemoryStream<any>,
  sinksNames: string[],
): (sources: Sources) => AppSinks {
  return function AppWithHooks(sources: Sources): AppSinks {
    const [gathered, sinks] = gatherSinks(sinksNames, () => {
      return withContext(
        [
          [sourcesKey, sources],
          [refSymbol, Ref()],
        ],
        () => {
          const appSinks = App(sources)
          const normalizedSinks =
            'DOM' in appSinks ? appSinks : { DOM: appSinks }

          normalizedSinks.DOM = trackChildren(normalizedSinks.DOM as any)
          return normalizedSinks as Sinks
        },
      )
    })

    return {
      state: xs.empty(),
      ...mergeSinks([gathered, sinks]),
      DOM: sinks.DOM,
    }
  }
}
