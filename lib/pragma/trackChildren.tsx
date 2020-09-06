import { assocPath } from 'rambda'
import xs, { Stream } from 'xstream'
import concat from 'xstream/extra/concat'
import { JSX } from '../types'
import { isObservable, streamify } from '../helpers'
import { safeUseRef, Ref, withRef } from './ref'
import { h, VNode } from '@cycle/dom'
import { ComponentDescription } from '.'

function unwrapObjectStream(in$: Stream<JSX.Element>): Stream<VNode> {
  return in$
    .map((val) => {
      const nested = indexTree(isObservable, val)
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

function indexTree<T>(condition: (val: any) => val is T, input: any) {
  let indexed: { value: T; path: (string | number)[] }[] = []

  function run(value, path: (string | number)[]) {
    if (condition(value)) {
      indexed.push({
        value,
        path,
      })
      return
    }

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

export function trackChildren(
  stream: JSX.Element | Stream<JSX.Element>,
): Stream<JSX.Element> {
  const ref = safeUseRef() || Ref()
  const END = Symbol('END')

  return concat<VNode | typeof END>(
    unwrapObjectStream(streamify(stream)),
    xs.of(END),
  )
    .map((vtree) => {
      return withRef(ref, () => {
        ref.tracker.open()
        const descs = indexTree(isComponentDescription, vtree)
        if (!descs.length) {
          ref.tracker.close()
          return vtree
        }

        const doms = descs.map((desc) => {
          const childRef = ref.tracker.track(
            desc.value._function,
            desc.value.data.key,
          )
          childRef.data.pushPropsAndChildren(
            desc.value.data.props as object,
            desc.value.data.children,
          )

          return childRef.data.instance.DOM.map((val) => (acc) =>
            assocPath(desc.path, val, acc),
          )
        })
        ref.tracker.close()

        return xs
          .combine(...doms)
          .map((funcs) => funcs.reduce((acc, func) => func(acc), vtree))
          .map(cleanup)
      })
    })
    .filter((x) => x !== END)
    .map(streamify)
    .flatten()
    .remember()

  function cleanup(vnode: any) {
    if (!vnode || typeof vnode !== 'object') {
      return vnode
    }

    if (Array.isArray(vnode)) {
      return vnode.map(cleanup).flat(Infinity).filter(Boolean)
    }

    if (vnode.children) {
      return h(
        vnode.sel,
        vnode.data,
        cleanup(vnode.children as any)
          .flat(Infinity)
          .filter(Boolean),
      )
    }
    return vnode
  }
}

function isComponentDescription(x: any): x is ComponentDescription<unknown> {
  return x && x._isComponent
}
