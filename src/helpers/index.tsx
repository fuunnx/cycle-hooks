import { Sinks } from '../types'
import xs, { Stream } from 'xstream'
import { mergeSinks as mergeSinks_ } from 'cyclejs-utils'
import $$observable from 'symbol-observable'

export function mapObj<T extends { [key: string]: U }, U, V>(
  func: (a: U) => V,
  obj: T,
): { [P in keyof T]: V } {
  let result: any = {}
  for (let key in obj) {
    result[key] = func(obj[key])
  }

  return result
}

// or else creates a maximum call stack error on typescript
interface MergeSinks {
  (sinks: Sinks[], opts?: object): Sinks
}
export const mergeSinks = mergeSinks_ as MergeSinks

export function isObservable(value: any): value is Stream<any> {
  if (!value) {
    return false
  }

  // eslint-disable-next-line no-use-extend-native/no-use-extend-native
  if (typeof value[Symbol.observable] === 'function') {
    return true
  }

  if (typeof value[$$observable] === 'function') {
    return true
  }

  return false
}

export function streamify<T>(x: T | Stream<T>): Stream<T> {
  return isObservable(x) ? x : xs.of(x)
}
