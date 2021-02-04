import { button, div } from '@cycle/dom'
import xs from 'xstream'
import { AppSources } from '.'
import { createSelector } from './libs/createSelector'

export const Timer = (sources: AppSources) => {
  const [resetSel, reset] = createSelector(sources)
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
