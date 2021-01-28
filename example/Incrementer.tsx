import { button, div } from '@cycle/dom'
import xs, { Stream } from 'xstream'
import { useAppSources } from '.'
import { stateReducer } from './hooks/state'

type Props = {
  value$: Stream<number>
}

export const Incrementer = function Incrementer(props$: Stream<Props>) {
  const { DOM } = useAppSources()

  const incrementer = DOM.select('#increment')
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

  const count$ = stateReducer(
    xs.merge(
      props$
        .map((x) => x.value$)
        .flatten()
        .map((value) => () => value),
      increment$,
    ),
    0,
  )

  return {
    DOM: count$.map((count) =>
      div([
        button('#increment', { props: { type: 'button' } }, [String(count)]),
        button('#reset', { props: { type: 'button' } }, ['Reset']),
      ]),
    ),
  }
}
