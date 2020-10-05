import { EffectName, safeUseContext, runWithHandlers } from '../context'
import xs from 'xstream'

type RegisterUnmountCallback = (callback: () => void) => void

const unMountKey: EffectName<RegisterUnmountCallback> = Symbol('unmount')
const unMountKeyComp: EffectName<RegisterUnmountCallback> = Symbol('unmount')
const unMountKeyStream: EffectName<RegisterUnmountCallback> = Symbol('unmount')

export function withUnmount<T>(
  exec: () => T,
  type: 'component' | 'stream' = 'stream',
) {
  let callbacks = []
  function addListener(callback) {
    callbacks.push(callback)
  }

  const key: EffectName<RegisterUnmountCallback> =
    type === 'stream' ? unMountKeyStream : unMountKeyComp

  const returnValue = runWithHandlers(
    {
      [unMountKey as symbol]: addListener,
      [key as symbol]: addListener,
    },
    exec,
  )

  safeUseContext(key)?.(triggerUnmount)

  return [triggerUnmount, returnValue] as const

  function triggerUnmount() {
    callbacks.forEach((x) => x())
  }
}

export function onUnmount(callback: () => void = () => {}) {
  const unmount$ = xs.create()
  let unmounted = false
  safeUseContext(unMountKey)?.(() => {
    if (unmounted) return

    callback()
    unmount$.shamefullySendNext(null)

    unmounted = true
  })
  return unmount$
}
