import { run } from '@cycle/run'
import { MainDOMSource, makeDOMDriver } from '@cycle/dom'
import { HTTPSource, makeHTTPDriver, RequestInput } from '@cycle/http'
import { withState, Reducer, StateSource } from '@cycle/state'
import { App } from './App'
import { Stream } from 'xstream'
import cuid from 'cuid'

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
  log: (sink$: Stream<any>) =>
    sink$.addListener({ next: (x) => console.log(x) }),
  createID: () => () => cuid(),
}

export type AppState = { value: string }

export type AppSources = {
  DOM: MainDOMSource
  HTTP: HTTPSource
  state: StateSource<AppState>
  createID: () => string
}

export type AppSinks = {
  DOM: Stream<any>
  HTTP?: Stream<RequestInput>
  log?: Stream<any>
  state: Stream<Reducer<AppState>>
}

run(withState(App), drivers)
