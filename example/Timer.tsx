import { button, div } from '@cycle/dom'
import xs from 'xstream'
import { useSel } from '../src/effects/sel'

export const Timer = () => {
  const [resetSel, resetDOM] = useSel()
  const reset$ = resetDOM.events('click').mapTo(null)
  const count$ = reset$
    .startWith(null)
    .map(() => xs.periodic(500).startWith(0))
    .flatten()

  return count$.map((count) =>
    div([`Count: ${count}`, button(resetSel, ['Reset'])]),
  )
}
