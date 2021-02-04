import { button, div } from '@cycle/dom'
import xs, { Stream } from 'xstream'
import { AppSources } from '.'
import { autorun } from './libs/autorun'
import { createSelector } from './libs/createSelector'

export function ButtonTest(sources: AppSources) {
  const [sinks1, button1] = makeButton(sources)
  const [sinks2, button2] = makeButton(sources)
  const Button3 = Button2(sources, xs.of({ label: 'Yay' }))

  const count1$ = sinks1.click$.fold((count) => count + 1, 0)
  const count2$ = sinks2.click$.fold((count) => count + 1, 0)
  const count3$ = Button3.click$.fold((count) => count + 1, 0)

  return {
    DOM: autorun((ex) => {
      const count1 = ex(count1$)
      const count2 = ex(count2$)

      return div([
        button1({ label: String(count1) }),
        button2({ label: String(count2) }),
        ex(Button3.DOM),
        ex(count3$),
      ])
    }),
  }
}

function makeButton(sources: AppSources) {
  const [ref, DOM] = createSelector(sources)
  const click$ = DOM.events('click')

  return [
    { click$ },
    function Button(props: { label: string }) {
      return button(ref, [props.label])
    },
  ] as const
}

type Button2Props = {
  label: string
}

function Button2(sources: AppSources, props$: Stream<Button2Props>) {
  const [ref, DOM] = createSelector(sources)
  const click$ = DOM.events('click')

  return {
    click$,
    DOM: props$
      .startWith({ label: '' })
      .map((props) => button(ref, [props.label])),
  }
}
