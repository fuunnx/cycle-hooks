import { JSX } from '../pragma/types'
import xs, { Stream } from 'xstream'
import { VNode } from 'snabbdom-to-html-common'
import { isObservable, streamify } from '.'
import { assocPath } from 'rambda'

export function unwrapVtree$(
  in$: JSX.Element | Stream<JSX.Element>,
): Stream<VNode> {
  return streamify(in$)
    .map((val) => {
      const nested = indexTree(val, isObservable)
      return xs
        .combine(
          ...nested.map((x) =>
            x.value
              .compose(unwrapVtree$)
              .map((unwrapped) => (acc) => assocPath(x.path, unwrapped, acc)),
          ),
        )
        .map((reducers) => reducers.reduce((acc, func) => func(acc), val))
    })
    .flatten()
}

export function indexTree<T>(
  input: any,
  match: (val: any) => val is T,
  stop: (val: any) => boolean = match,
) {
  let indexed: { value: T; path: (string | number)[] }[] = []

  function run(value, path: (string | number)[]) {
    if (match(value)) {
      indexed.push({
        value,
        path,
      })
    }

    if (stop(value)) return
    if (!value || typeof value !== 'object') return

    if (Array.isArray(value)) {
      value.forEach((x, index) => run(x, [...path, index]))
      return
    }

    Object.entries(value).forEach(([k, v]) => run(v, [...path, k]))
    return
  }

  run(input, [])

  return indexed
}
