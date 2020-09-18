import { run } from '@cycle/run'
import { makeDOMDriver } from '@cycle/dom'
import modules from '@cycle/dom/lib/es6/modules'
import { withHooks } from '../lib/wrapper'
import { makeEffectsDriver } from '../lib/driver'
import { eventListenersModule } from 'snabbdom/build/package/modules/eventlisteners'
import { withState } from '@cycle/state'
import { App } from './App'
import { Stream } from 'xstream'

const drivers = {
  effects: makeEffectsDriver(),
  DOM: makeDOMDriver('#app', {
    modules: [...modules, eventListenersModule],
  }),
  log: (sink$: Stream<any>) =>
    sink$.addListener({ next: (x) => console.log(x) }),
}

run(withState(withHooks(App, [...Object.keys(drivers), 'state'])), drivers)
