import xs, { Stream } from 'xstream'
import $$observable from 'symbol-observable'

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
