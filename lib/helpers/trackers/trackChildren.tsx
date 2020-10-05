import { assocPath } from 'rambda'
import xs, { Stream } from 'xstream'
import concat from 'xstream/extra/concat'
import { streamify, isObservable } from '..'
import { safeUseRef, Ref, withRef } from '../../pragma/ref'
import { h } from '@cycle/dom'
import { ComponentDescription, JSX } from '../../pragma/types'
import { indexTree } from '../unwrapVtree$'

export function trackChildren(
  stream: JSX.Element | Stream<JSX.Element>,
): Stream<JSX.Element> {
  const ref = safeUseRef() || Ref()
  const END = Symbol('END')

  return concat<JSX.Element | typeof END>(streamify(stream), xs.of(END))
    .map((vtree) => {
      return withRef(ref, () => {
        ref.tracker.open()
        const descs = indexTree(
          vtree,
          isComponentDescription,
          (x) => isObservable(x) || isComponentDescription(x),
        )
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
