import { run } from '@cycle/run'
import { makeDOMDriver } from '@cycle/dom'
import modules from '@cycle/dom/lib/es6/modules'
import { withHooks } from '../lib/wrapper'
import { makeEffectsDriver } from '../lib/driver'
import { eventListenersModule } from 'snabbdom/build/package/modules/eventlisteners'
import { withState } from '@cycle/state'
import { App } from './App'

const drivers = {
  effects: makeEffectsDriver(),
  DOM: makeDOMDriver('#app', {
    modules: [...modules, eventListenersModule],
  }),
}

run(withState(withHooks(App, [...Object.keys(drivers), 'state'])), drivers)
