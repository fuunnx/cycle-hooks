import { button, div } from '@cycle/dom'
import xs from 'xstream'
import { useSel } from '../src/effects/sel'

export const Timer = () => {
  const [resetSel, reset] = useSel()
  const reset$ = reset.events('click').mapTo(null)
  const count$ = reset$
    .startWith(null)
    .map(() => xs.periodic(500).startWith(0))
    .flatten()

  return {
    DOM: count$.map((count) =>
      div([`Count: ${count}`, button(resetSel, ['Reset'])]),
    ),
  }
}
