import xs, { Stream } from 'xstream'
import { run } from '@cycle/run'
import { createElement } from '../lib/pragma'
import { MainDOMSource, makeDOMDriver } from '@cycle/dom'

type AppSources = {
  DOM: MainDOMSource
}

function App(sources: AppSources) {
  const component = Component({ ...sources, props$: xs.of({ name: 'World' }) })
  const count$ = component.click$
    .map(() => (state) => state + 1)
    .fold((x) => x + 1, 0)

  return {
    otherSink: component.otherSink,
    DOM: xs.combine(count$, component.DOM).map((args) => {
      const [count, componentDOM] = args

      return (
        <div>
          {componentDOM}
          {count}
        </div>
      )
    }),
  }
}

type ComponentSources = AppSources & {
  props$: Stream<{
    name: string
  }>
}

function Component(sources: ComponentSources) {
  const { props$, DOM } = sources

  return {
    otherSink: xs.of('thing'),
    click$: DOM.select('[data-has-onClick]')
      .events('click')
      .map((e) => e.target['props-map-onClick'](e)),
    DOM: props$.map((props) => {
      const { name } = props

      return (
        <button props-map-onClick={(event) => event}>
          Hello {props.name}!
        </button>
      )
    }),
  }
}

run(App, {
  DOM: makeDOMDriver('#app'),
  otherSink: (sink$) => sink$.addListener({ next: console.log }),
})
