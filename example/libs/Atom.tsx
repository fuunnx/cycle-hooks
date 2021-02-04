import { StateSource, Lens, Reducer, Scope } from '@cycle/state'
import { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { createID } from '../../src/effects/id'
import { performEffects } from '../../src/effects/sinks'
import { useSources } from '../../src/effects/sources'

export type Atom<T> = Omit<StateSource<T>, '_stream'> & {
  lens: <R>(lens: Scope<T, R>) => Atom<R>
  modify: (reducer$?: Stream<Reducer<T>>) => Stream<T>
}

export function Atom<T>(
  source?: StateSource<T>,
  performWrite?: (reducer$: Stream<Reducer<T>>) => void,
): Atom<T> {
  const id = `atom_${createID()}`
  if (!source) {
    const src = useSources<{ state: StateSource<T> }>().state
    source = src.select(id)
  }

  performWrite =
    performWrite ||
    function write(reducer$: Stream<Reducer<T>>) {
      performEffects({ state: source.isolateSink(reducer$, id) })
    }

  return Object.assign({}, source, {
    lens<R>(lens: Scope<T, R>): Atom<R> {
      return Atom(source.isolateSource(source, lens), function (
        reducer$: Stream<Reducer<R>>,
      ) {
        performWrite(source.isolateSink(reducer$, lens))
      })
    },
    modify(reducer$?: Stream<Reducer<T>>) {
      if (reducer$) {
        performWrite(reducer$)
      }

      return source.stream.compose(dropRepeats())
    },
  })
}
