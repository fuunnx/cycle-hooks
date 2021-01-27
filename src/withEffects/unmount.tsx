import { EffectName, performOrFailSilently, withHandler } from 'performative-ts'
import xs from 'xstream'

export type RegisterUnmountCallback = (callback: () => void) => void

const registerUnmountSymbol: EffectName<RegisterUnmountCallback> = Symbol(
  'registerUnmount',
)

const registerStreamUnmountSymbol: EffectName<RegisterUnmountCallback> = Symbol(
  'registerStreamUnmount',
)

export function withUnmount<T>(
  exec: () => T,
  registerOwnChannelSymbol: EffectName<
    RegisterUnmountCallback
  > = registerStreamUnmountSymbol,
) {
  let callbacks = []
  function addListener(callback) {
    callbacks.push(callback)
  }

  const returnValue = withHandler(
    [registerUnmountSymbol, addListener],
    [registerOwnChannelSymbol, addListener],
    exec,
  )

  performOrFailSilently(registerOwnChannelSymbol, triggerUnmount)

  return [triggerUnmount, returnValue] as const

  function triggerUnmount() {
    callbacks.forEach((x) => x())
  }
}

export function onUnmount(callback: () => void = () => {}) {
  const unmount$ = xs.create()
  let unmounted = false
  performOrFailSilently(registerUnmountSymbol, () => {
    if (unmounted) return

    callback()
    unmount$.shamefullySendNext(null)

    unmounted = true
  })
  return unmount$
}
