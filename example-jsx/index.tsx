import { run } from '@cycle/run'
import { makeDOMDriver } from '@cycle/dom'
import { makeHTTPDriver } from '@cycle/http'
import { withEffects } from '../src'
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
  const sinks = withEffects<Sinks>(App)(sources)

  return sinks
}

run(withState(Main), drivers)
