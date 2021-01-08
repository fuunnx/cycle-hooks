import { run } from '@cycle/run'
import { makeDOMDriver } from '@cycle/dom'
import { makeHTTPDriver } from '@cycle/http'
import { withHooks } from '../src'
import toHTML from 'snabbdom-to-html'
import { diffHtml } from '@markedjs/html-differ'
import logger from '@markedjs/html-differ/lib/logger'
import { withState, Reducer } from '@cycle/state'
import { App } from './App'
import { Stream } from 'xstream'

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
  log: (sink$: Stream<any>) =>
    sink$.addListener({ next: (x) => console.log(x) }),
}

type Sinks = {
  DOM: Stream<any>
  log: Stream<any>
  state: Stream<Reducer<any>>
}

function Main(sources) {
  const sinks = withHooks<Sinks>(App, [...Object.keys(drivers), 'state'])(
    sources,
  )

  return sinks
}

run(withState(Main), drivers)
