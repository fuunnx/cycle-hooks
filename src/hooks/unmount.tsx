import { EffectName, performOrFailSilently, withHandler } from 'performative-ts'
import xs from 'xstream'

type RegisterUnmountCallback = (callback: () => void) => void

const registerUnmountEff: EffectName<RegisterUnmountCallback> = Symbol(
  'registerUnmountEff',
)
const registerComponentUnmountEff: EffectName<RegisterUnmountCallback> = Symbol(
  'registerComponentUnmountEff',
)
const registerStreamUnmountEff: EffectName<RegisterUnmountCallback> = Symbol(
  'registerStreamUnmountEff',
)

export function withUnmount<T>(
  exec: () => T,
  type: 'component' | 'stream' = 'stream',
) {
  let callbacks = []
  function addListener(callback) {
    callbacks.push(callback)
  }

  const registerOwnChannelEff: EffectName<RegisterUnmountCallback> =
    type === 'stream' ? registerStreamUnmountEff : registerComponentUnmountEff

  const returnValue = withHandler(
    [registerUnmountEff, addListener],
    [registerOwnChannelEff, addListener],
    exec,
  )

  performOrFailSilently(registerOwnChannelEff, triggerUnmount)

  return [triggerUnmount, returnValue] as const

  function triggerUnmount() {
    callbacks.forEach((x) => x())
  }
}

export function onUnmount(callback: () => void = () => {}) {
  const unmount$ = xs.create()
  let unmounted = false
  performOrFailSilently(registerUnmountEff, () => {
    if (unmounted) return

    callback()
    unmount$.shamefullySendNext(null)

    unmounted = true
  })
  return unmount$
}
