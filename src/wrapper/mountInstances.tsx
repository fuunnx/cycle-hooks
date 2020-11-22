import xs, { Stream } from 'xstream'
import concat from 'xstream/extra/concat'
import { streamify, isObservable } from '../libs/isObservable'
import { safeUseRef, Ref, withRef } from './ref'
import { h, VNode } from '@cycle/dom'
import { ComponentDescription } from '../pragma/types'
import { indexVTree, assocVTree } from '../libs/VTree'

export function mountInstances(
  stream: JSX.Element | Stream<JSX.Element>,
): Stream<JSX.Element> {
  const ref = safeUseRef() || Ref()
  const END = Symbol('END')

  return concat<JSX.Element | typeof END>(streamify(stream), xs.of(END))
    .map((vtree) => {
      return withRef(ref, () => {
        ref.tracker.open()
        const descriptions = indexVTree(
          vtree,
          isComponentDescription,
          (x) => isObservable(x) || isComponentDescription(x),
        )
        if (!descriptions.length) {
          ref.tracker.close()
          return vtree
        }

        const doms = descriptions.map(({ value, path }) => {
          const childRef = ref.tracker.track(value._function, value.data.key)

          childRef.data.pushPropsAndChildren(
            value.data.props as object,
            value.data.children,
          )

          return childRef.data.instance.DOM.map(
            (val: VNode | string) => (acc) => assocVTree(path, val, acc),
          )
        })
        ref.tracker.close()

        return xs
          .merge(...doms)
          .fold((acc, func) => func(acc), vtree)
          .drop(1)
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

export function isComponentDescription(
  x: any,
): x is ComponentDescription<unknown> {
  return x && x._isComponent
}
