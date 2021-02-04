import { button, div } from '@cycle/dom'
import xs, { Stream } from 'xstream'
import { createSelector } from '../src/effects/sel'
import { autorun } from './libs/autorun'

export function ButtonTest() {
  const [sinks1, button1] = makeButton()
  const [sinks2, button2] = makeButton()
  const Button3 = Button2(xs.of({ label: 'Yay' }))

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

function makeButton() {
  const [ref, DOM] = createSelector()
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

function Button2(props$: Stream<Button2Props>) {
  const [ref, DOM] = createSelector()
  const click$ = DOM.events('click')

  return {
    click$,
    DOM: props$
      .startWith({ label: '' })
      .map((props) => button(ref, [props.label])),
  }
}
