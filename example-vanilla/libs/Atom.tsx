import { StateSource, Reducer, Scope } from '@cycle/state'
import xs, { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'

export type Atom<T> = Omit<StateSource<T>, '_stream'> & {
  lens: <R>(lens: Scope<T, R>) => Atom<R>
  modify: (reducer$?: Stream<Reducer<T>>) => [Stream<Reducer<T>>, Stream<T>]
}

export function Atom<T>(
  sources: { state: StateSource<T>; createID: () => string },
  performWrite?: (reducer$: Stream<Reducer<T>>) => Stream<Reducer<any>>,
): Atom<T> {
  const id = `atom_${sources.createID()}`
  const state = performWrite
    ? sources.state
    : (sources.state.select(id) as StateSource<T>)

  performWrite =
    performWrite ||
    function write(reducer$: Stream<Reducer<T>>) {
      return state.isolateSink(reducer$, id)
    }

  return Object.assign({}, state, {
    lens<R>(lens: Scope<T, R>): Atom<R> {
      return Atom<R>(
        { ...sources, state: state.isolateSource(state, lens) },
        function (reducer$?: Stream<Reducer<R>>): Stream<Reducer<any>> {
          return performWrite(state.isolateSink(reducer$ || xs.empty(), lens))
        },
      )
    },
    modify(reducer$?: Stream<Reducer<T>>) {
      return [
        performWrite(reducer$ || xs.empty()),
        state.stream.compose(dropRepeats()),
      ] as [Stream<Reducer<any>>, Stream<T>]
    },
  })
}
