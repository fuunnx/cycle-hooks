import { run } from '@cycle/run'
import { useSources } from '../../../src/effects/sources'
import { createElement, withEffects } from '../../../src'
import { performEffects } from '../../../src/effects/sinks'
import xs, { Stream } from 'xstream'
import { makeDOMDriver, MainDOMSource } from '@cycle/dom'
import { useRef } from '../../jsx/effects/ref'
import { streamify } from '../../jsx/libs/isObservable'

type Ref<T extends Cycle.EC<{}>> = {
  DOM: MainDOMSource
  selector: string
  sinks: ReturnType<T>
}

type DOMSinks = JSX.Element | any
namespace Cycle {
  export type EC<Props, Sinks = DOMSinks> = {
    (props$: Stream<Props> | Props): Sinks extends DOMSinks
      ? Sinks
      : {
          [P in keyof ComponentSinks]: Stream<ComponentSinks[P]>
        }
  }
  export type FC<Props = undefined> = (props: Props) => DOMSinks
}

// for proper typings in JSX
function EC<ComponentProps, ComponentSinks = DOMSinks>(
  Component: (
    props$: Stream<ComponentProps>,
  ) => ReturnType<Cycle.EC<ComponentProps, ComponentSinks>>,
): Cycle.EC<ComponentProps, ComponentSinks> {
  return function name(props$) {
    return Component(streamify(props$))
  }
}

type AppSources = {
  DOM: MainDOMSource
}

function App() {
  const componentRef = useRef<typeof Component>()
  const count$ = componentRef.sinks.click$.fold((x) => x + 1, 0)

  return count$
    .fold((x) => x + 1, 0)
    .map((count) => {
      return (
        <div>
          <Component ref={componentRef} name="World" />
          {count}
        </div>
      )
    })
}

function App2() {
  const component = Component(xs.of({ name: 'world' }))
  const count$ = component.click$.fold((x) => x + 1, 0)

  return xs.combine(component.DOM, count$).map(([component, count]) => {
    return (
      <div>
        {component}
        {count}
      </div>
    )
  })
}

function App3() {
  const component = Component(xs.of({ name: 'world' }))
  const count$ = component.click$.fold((x) => x + 1, 0)

  return count$
    .fold((x) => x + 1, 0)
    .map((count) => {
      return (
        <div>
          <Component.DOM name="World" />
          {count}
        </div>
      )
    })
}

type ComponentProps = {
  name: string
}

type ComponentSinks = {
  DOM: Stream<DOMSinks>
  click$: Stream<MouseEvent>
}

const Component = EC<ComponentProps, ComponentSinks>(function Component(
  props$,
) {
  const buttonRef = useRef()
  const sources = useSources<AppSources>()

  performEffects({
    HTTP: sources.DOM.events('click').mapTo('url'),
  })

  return {
    click$: buttonRef.DOM.events('click'),
    DOM: props$.map((props) => {
      const { name } = props

      return <button>Hello {name}!</button>
    }),
  }
})

run(withEffects(['DOM', 'otherSink'], App), {
  DOM: makeDOMDriver('#app'),
  otherSink: (sink$) => sink$.addListener({ next: console.log }),
})
