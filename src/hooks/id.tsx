import { EffectName, performOrFailSilently, withHandler } from 'performative-ts'
import cuid from 'cuid'

const ID_GEN: EffectName<() => string> = Symbol('ID_GEN')

export function useID() {
  const id = performOrFailSilently(ID_GEN)
  return id || cuid()
}

export function withID(func) {
  let i = 0
  return withHandler([ID_GEN, () => `id-${i++}`], func)
}
