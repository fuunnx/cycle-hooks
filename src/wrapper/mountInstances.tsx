import xs, { Stream, Subscription } from 'xstream'
import { streamify } from '../libs/isObservable'
import { safeUseRef, Ref, createRefTracker, withRef } from './ref'
import { h, VNode } from '@cycle/dom'
import { ComponentDescription } from '../pragma/types'
import { indexVTree, assocVTree } from '../libs/VTree'

export function mountInstances(
  stream: JSX.Element | Stream<JSX.Element>,
): Stream<JSX.Element> {
  const ref = safeUseRef() || Ref()
  let tracker = createRefTracker()
  ref.trackers.push(tracker)

  let subscription: Subscription

  return withRef(ref, () => {
    return xs.createWithMemory({
      start(listener) {
        let currentVTree

        subscription = streamify(stream).subscribe({
          next: (vtree) => {
            currentVTree = vtree
            const descriptions = indexVTree(
              vtree as any,
              isComponentDescription,
            )

            tracker.open()
            descriptions.forEach(({ value, path }) => {
              const childRef = tracker.track(
                value.$func$,
                value.data.key,
                value,
              )

              currentVTree = assocVTree(
                path,
                childRef.data.currentVTree,
                currentVTree,
              )

              childRef.data.domCallback = (val: VNode | string) => {
                currentVTree = assocVTree(path, val, currentVTree)
                listener.next(cleanup(currentVTree))
              }
            })
            tracker.close()

            listener.next(cleanup(currentVTree))
          },
        })
      },
      stop() {
        subscription.unsubscribe()

        ref.trackers = ref.trackers.filter((x) => x !== tracker)
        tracker.destroy()
        tracker = null
      },
    })
  })
}

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

  if (isComponentDescription(vnode)) {
    return null
  }

  return vnode
}

export function isComponentDescription(x: any): x is ComponentDescription {
  return x && x.$type$ === 'component'
}
