import { run } from '@cycle/run'
import { MainDOMSource, makeDOMDriver } from '@cycle/dom'
import { HTTPSource, makeHTTPDriver } from '@cycle/http'
import { withEffects } from '../src'
import { withState, Reducer, StateSource } from '@cycle/state'
import { App } from './App'
import { Stream } from 'xstream'
import { useSources } from '../src/effects/sources'
import { performEffects } from '../src/effects/sinks'
import { withIDGenerator } from '../src/effects/id'

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
  log: (sink$: Stream<any>) =>
    sink$.addListener({ next: (x) => console.log(x) }),
}

export type AppState = { value: string }

type Sources<S> = {
  DOM: MainDOMSource
  HTTP: HTTPSource
  state: StateSource<S>
}

type Sinks<S> = EffectsSinks<S> & {
  DOM: Stream<any>
}

type EffectsSinks<S> = {
  log: Stream<any>
  state: Stream<Reducer<S>>
}

export function useAppSources<State = AppState>() {
  return useSources<Sources<State>>()
}

export function performAppEffects<State = AppState>(
  effects: Partial<EffectsSinks<State>>,
) {
  return performEffects(effects)
}

run(
  withState(
    withEffects<Sources<AppState>, Sinks<AppState>>(withIDgenerator(App)),
  ),
  drivers,
)
