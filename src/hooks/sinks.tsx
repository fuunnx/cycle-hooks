import '../patches/xstream'

import { Sinks } from '../types'
import xs, { Stream } from 'xstream'
import { replicateMany } from '@cycle/run/lib/cjs/internals'
import {
  EffectName,
  withHandler,
  perform,
  performOrFailSilently,
} from 'performative-ts'
import { onUnmount } from './unmount'
import { mapObj } from '../libs/mapObj'

export type Registerer = (sinks: Sinks, stopSignal$?: Stream<any>) => void
export const gatherEffect: EffectName<Registerer> = Symbol('registerer')

type GatherableKeys = string[]
const readGatherableEff: EffectName<() => GatherableKeys> = Symbol(
  'gatherableKeys',
)

export function gatherSinks<T>(exec: () => T): [Sinks, T]
export function gatherSinks<T>(
  gatherableKeys: string[],
  exec: () => T,
): [Sinks, T]
export function gatherSinks<T>(
  keys_: string[] | (() => T),
  exec_?: () => T,
): [Sinks, T] {
  // type arguments
  let exec: () => T
  let keys: string[]
  if (exec_) {
    exec = exec_ as () => T
    keys = keys_ as string[]
  } else {
    exec = keys_ as () => T
    keys = [] as string[]
  }

  // implementation
  const scopeKeys = performOrFailSilently(readGatherableEff) ?? []
  const gatherableKeys = [...scopeKeys, ...keys]

  let sinksProxy = initSinksProxy()
  function gatherer(sinks: Sinks, stopSignal$: Stream<any> = onUnmount()) {
    if (process.env.NODE_ENV !== 'production') {
      Object.keys(sinks).forEach((key) => {
        if (!gatherableKeys.includes(key)) {
          console.warn(
            `Unknown registered sink "${key}", please add it to "withHooks" second argument`,
          )
        }
      })
    }

    let dispose = () => {}
    dispose = replicateMany(
      mapObj(
        (x$: Stream<any>) =>
          x$.endWhen(stopSignal$.debug(() => Promise.resolve().then(dispose))),
        sinks,
      ),
      sinksProxy,
    )
  }

  const returnValue = withHandler(
    {
      [gatherEffect as symbol]: gatherer,
      [readGatherableEff as symbol]: () => gatherableKeys,
    },
    exec,
  )

  return [sinksProxy, returnValue]

  function initSinksProxy(): { [key: string]: Stream<unknown> } {
    return Object.fromEntries(gatherableKeys.map((key) => [key, xs.create()]))
  }
}

export function registerSinks(
  sinks: Sinks,
  stopSignal$: Stream<any> = onUnmount(),
) {
  return perform(gatherEffect, sinks, stopSignal$)
}
