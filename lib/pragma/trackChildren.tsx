import { assocPath } from 'rambda'
import { VNode } from 'snabbdom-to-html-common'
import xs, { Stream } from 'xstream'
import concat from 'xstream/extra/concat'
import { JSX } from '../../definitions'
import { isObservable, streamify } from '../helpers'
import { safeUseRef, Ref, withRef } from './ref'

function unwrapObjectStream(in$: Stream<JSX.Element>): Stream<VNode> {
  return in$
    .map((val) => {
      const nested = indexNestedStreams(val)
      return xs
        .combine(
          ...nested.map((x) =>
            x.value
              .compose(unwrapObjectStream)
              .map((unwrapped) => (acc) => assocPath(x.path, unwrapped, acc)),
          ),
        )
        .map((reducers) => reducers.reduce((acc, func) => func(acc), val))
    })
    .flatten()
}

type IndexedStream<T> = {
  path: (string | number)[]
  value: Stream<T>
}

function indexNestedStreams(input: any) {
  let indexed: IndexedStream<unknown>[] = []

  function run(value, path: (string | number)[]) {
    if (!value || typeof value !== 'object') return
    if (isObservable(value)) {
      indexed.push({
        value,
        path,
      })
      return
    }
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

export function trackChildren(stream: VNode | Stream<VNode>): Stream<VNode> {
  const ref = safeUseRef() || Ref()
  const END = Symbol('END')

  return concat(unwrapObjectStream(streamify(stream)), xs.of(END as any))
    .map((vtree) => {
      return withRef(ref, () => {
        return walk(vtree)
      })
    })
    .filter((x) => x !== END)
    .map(streamify)
    .flatten()
    .remember()

  function walk(vnode: JSX.Element) {
    if (!vnode || typeof vnode !== 'object') {
      return vnode
    }
    if ('_isComponent' in vnode) {
      const childRef = ref.tracker.track(vnode._function)
      childRef.data.pushPropsAndChildren(
        (vnode as any).props,
        vnode.data.children as any,
      )
      return childRef.data.instance.DOM as any
    }

    if (vnode.children) {
      return xs
        .combine(...vnode.children.map(walk).map(streamify))
        .map((children) => {
          return {
            ...vnode,
            children,
          }
        })
    }
    return vnode
  }
}
