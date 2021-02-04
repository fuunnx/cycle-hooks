import { button, div } from '@cycle/dom'
import xs, { Stream } from 'xstream'
import { AppSources } from '.'
import { stateReducer } from './hooks/state'
import { createSelector } from './libs/createSelector'

type Props = {
  value$: Stream<number>
}

export const Incrementer = function Incrementer(
  sources: AppSources,
  props$: Stream<Props>,
) {
  const [incSel, incrementer] = createSelector(sources)
  const isDown$ = xs
    .merge(
      incrementer.events('mousedown').mapTo(true),
      incrementer.events('mouseleave').mapTo(false),
      incrementer.events('mouseup').mapTo(false),
    )
    .startWith(false)

  const increment$ = isDown$
    .map((down) => (down ? xs.periodic(50).startWith(null) : xs.empty()))
    .flatten()
    .mapTo((x: number) => x + 1)

  const [resetSel, resetter] = createSelector(sources)
  const reset$ = resetter.events('click').mapTo(() => 0)

  const count$ = stateReducer(
    xs.merge(
      increment$,
      reset$,
      props$
        .map((x) => x.value$)
        .flatten()
        .map((value) => () => value),
    ),
    0,
  )

  return {
    DOM: count$.map((count) =>
      div([
        button(incSel, { props: { type: 'button' } }, [String(count)]),
        button(resetSel, { props: { type: 'button' } }, ['Reset']),
      ]),
    ),
  }
}
