import { run } from '@cycle/run'
import { MainDOMSource, makeDOMDriver } from '@cycle/dom'
import { HTTPSource, makeHTTPDriver } from '@cycle/http'
import { withEffects } from '../src'
import { withState, Reducer, StateSource } from '@cycle/state'
import { App } from './App'
import { Stream } from 'xstream'
import { useSources } from '../src/effects/sources'

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
  log: (sink$: Stream<any>) =>
    sink$.addListener({ next: (x) => console.log(x) }),
}

export type AppState = { value: string }

type Sources = {
  DOM: MainDOMSource
  HTTP: HTTPSource
  state: StateSource<AppState>
}

type Sinks = {
  DOM: Stream<any>
  log: Stream<any>
  state: Stream<Reducer<any>>
}

export function useAppSources() {
  return useSources<Sources>()
}

run(withState(withEffects<Sources, Sinks>(App)), drivers)
