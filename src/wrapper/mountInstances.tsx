import xs, { Stream, Subscription } from 'xstream'
import { isObservable, streamify } from '../libs/isObservable'
import { safeUseRef, Ref, createRefTracker, withRef } from './ref'
import { h, VNode } from '@cycle/dom'
import { ComponentDescription } from '../pragma/types'
import { indexVTree, assocVTree } from '../libs/VTree'
import { readSourcesEffect } from '../hooks/sources'
import { provideSinksEff } from '../hooks/sinks'
import { withFrame, withHandler } from 'performative-ts'

const knownTypes = new Map<Function, 'functionnal' | 'cyclic'>()

function componentType(
  component: Function,
  props: any,
): 'functionnal' | 'cyclic' {
  if (knownTypes.has(component)) {
    return knownTypes.get(component)
  }

  const type = guess()
  knownTypes.set(component, type)
  return type

  function guess(): 'functionnal' | 'cyclic' {
    try {
      const result = withHandler(
        [
          readSourcesEffect,
          () => {
            throw '$IS_CYCLIC_COMPONENT'
          },
        ],
        [
          provideSinksEff,
          () => {
            throw '$IS_CYCLIC_COMPONENT'
          },
        ],
        () => component(props),
      )
      if (isObservable(result)) {
        return 'cyclic'
      }

      return 'functionnal'
    } catch (e) {
      if (e === '$IS_CYCLIC_COMPONENT') return 'cyclic'
      else throw e
    }
  }
}

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

        let scheduled = false
        function scheduleNext() {
          if (scheduled) return
          scheduled = true
          Promise.resolve().then(() => {
            listener.next(cleanup(currentVTree))
            scheduled = false
          })
        }

        subscription = streamify(stream).subscribe({
          next: (vtree) => {
            currentVTree = vtree
            const descriptions = indexVTree(
              vtree as any,
              isComponentDescription,
            )

            tracker.open()
            const childRefs = descriptions.map(({ value, path }) => {
              const props = {
                ...value.data.props,
                children: value.data.children,
              }
              const type = componentType(value.$func$, props)

              if (type === 'functionnal') {
                const vtree = withFrame(value.$frame$, () =>
                  value.$func$(props),
                )

                currentVTree = assocVTree(path, vtree as VNode, currentVTree)

                return {
                  data: {
                    currentVTree: vtree,
                  },
                }
              }

              const childRef = tracker.track(
                value.$func$,
                value.data.key,
                value,
              )

              if (childRef.data.currentVTree) {
                currentVTree = assocVTree(
                  path,
                  childRef.data.currentVTree,
                  currentVTree,
                )
              }

              childRef.data.domCallback = (val: VNode | string) => {
                currentVTree = assocVTree(path, val, currentVTree)
                if (childRefs.every((child) => child.data.currentVTree)) {
                  scheduleNext()
                }
              }

              return childRef
            })
            tracker.close()

            if (childRefs.every((child) => child.data.currentVTree)) {
              scheduleNext()
            }
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
