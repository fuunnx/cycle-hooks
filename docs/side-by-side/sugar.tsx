import { run } from '@cycle/run'
import { useProps } from '../../src/hooks/props'
import { useSources } from '../../src/hooks/sources'
import { useState } from '../../example/hooks/state'
import { createElement, withHooks } from '../../src'
import { registerSinks } from '../../src/hooks/sinks'
import xs from 'xstream'
import { makeDOMDriver, DOMSource } from '@cycle/dom'

type AppSources = {
  DOM: DOMSource
}

function App() {
  const [count$, setCount] = useState(0)

  return count$.map((count) => {
    return (
      <div>
        <Component
          name="World"
          onClick={() => setCount((state) => state + 1)}
        />
        {count}
      </div>
    )
  })
}

type ComponentProps = {
  name: string
  onClick: (event: Event) => unknown
}

function Component(_: ComponentProps) {
  const sources = useSources<AppSources>()
  const props$ = useProps<ComponentProps>()

  registerSinks({
    otherSink: xs.of('thing'),
  })

  return props$.map((props) => {
    const { name, onClick } = props

    return <button onClick={onClick}>Hello {name}!</button>
  })
}

run(withHooks(App, ['DOM', 'otherSink']), {
  DOM: makeDOMDriver('#app'),
  otherSink: (sink$) => sink$.addListener({ next: console.log }),
})
