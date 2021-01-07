import { run } from '@cycle/run'
import { makeDOMDriver } from '@cycle/dom'
import modules from '@cycle/dom/lib/es6/modules'
import { withHooks } from '../src'
import { eventListenersModule } from 'snabbdom/build/package/modules/eventlisteners'
import { withState, Reducer } from '@cycle/state'
import { App } from './App'
import { Stream } from 'xstream'

const drivers = {
  DOM: makeDOMDriver('#app', {
    modules: [...modules, eventListenersModule],
  }),
  log: (sink$: Stream<any>) =>
    sink$.addListener({ next: (x) => console.log(x) }),
}

type Sinks = {
  DOM: Stream<any>
  log: Stream<any>
  state: Stream<Reducer<any>>
}

function Main(sources) {
  sources.state.stream.debug('state').addListener({
    error(e) {
      throw e
    },
  })
  const sinks = withHooks<Sinks>(App, [...Object.keys(drivers), 'state'])(
    sources,
  )

  return { ...sinks, DOM: sinks.DOM }
}

run(withState(Main), drivers)
