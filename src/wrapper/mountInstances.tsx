import xs, { Stream } from 'xstream'
import { streamify } from '../libs/isObservable'
import { safeUseRef, Ref, createRefTracker, withRef } from './ref'
import { h, VNode } from '@cycle/dom'
import { ComponentDescription } from '../pragma/types'
import { indexVTree, assocVTree } from '../libs/VTree'
import uponStop from 'xstream-upon-stop'

export function mountInstances(
  stream: JSX.Element | Stream<JSX.Element>,
): Stream<JSX.Element> {
  const ref = safeUseRef() || Ref()
  let tracker = createRefTracker()
  ref.trackers.push(tracker)

  return withRef(ref, () => {
    return streamify(stream)
      .map((vtree) => {
        const descriptions = indexVTree(vtree, isComponentDescription)

        if (!descriptions.length) {
          tracker.open()
          tracker.close()
          return xs.of(vtree)
        }

        tracker.open()
        const doms = descriptions.map(({ value, path }) => {
          const childRef = tracker.track(value.$func$, value.$data$.key, value)

          return childRef.data.sinks.DOM.map((val: VNode | string) => (acc) =>
            assocVTree(path, val, acc),
          )
        })
        tracker.close()

        return xs
          .merge(...doms)
          .fold((acc, func) => func(acc), vtree)
          .drop(1)
          .map(cleanup)
      })
      .flatten()
      .remember()
      .compose(
        uponStop(() => {
          ref.trackers = ref.trackers.filter((x) => x !== tracker)
          tracker.destroy()
          tracker = null
        }),
      )
  })

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

export function isComponentDescription(x: any): x is ComponentDescription {
  return x && x.$type$ === 'component'
}
