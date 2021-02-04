import {
  bindHandler,
  EffectName,
  performOrFailSilently,
  withHandler,
} from 'performative-ts'
import cuid from 'cuid'

const ID_GEN: EffectName<() => string> = Symbol('ID_GEN')

export function createID() {
  const id = performOrFailSilently(ID_GEN)
  return id || cuid()
}

export function withIDGenerator(func) {
  let i = 0
  return bindHandler([ID_GEN, () => `id-${i++}`], func)
}
