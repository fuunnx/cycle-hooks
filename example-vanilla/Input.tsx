import { input } from '@cycle/dom'
import { useSel } from '../src/effects/sel'
import { Atom } from './libs/Atom'
import { Stream } from 'xstream'
import { Reducer } from '@cycle/state'
import { createSelector } from './libs/createSelector'
import { AppSources } from '.'

export function Input(
  sources: AppSources,
  props$: Stream<{ state: Atom<string> }>,
) {
  const [inputSel, inputDOM] = createSelector(sources)

  const stateAndReducer$ = props$.map((x) =>
    x.state.modify(
      inputDOM
        .events('input')
        .map((event) => (event.target as any).value as string)
        .startWith('')
        .map((value) => (_) => value),
    ),
  )

  const reducer$ = stateAndReducer$.map((x) => x[0]).flatten() as Stream<
    Reducer<any>
  >
  const state$ = stateAndReducer$.map((x) => x[1]).flatten()

  return {
    state: reducer$,
    DOM: state$.map((state) =>
      input(inputSel, { props: { type: 'text', value: state || '' } }),
    ),
  }
}
