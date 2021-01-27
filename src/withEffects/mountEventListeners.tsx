import { Stream, Subscription } from 'xstream'
import { useSources } from '../hooks/sources'
import { walkVTree, isVNode } from '../libs/VTree'
import { vnode, VNode } from 'snabbdom/build/package/vnode'
import { onUnmount } from './unmount'
import { makeUsageTrackerKeyed } from '../libs/trackers/trackUsageKeyed'
import { isComponentDescription } from './mountInstances'

type EventSubscription = {
  subscription: Subscription
  onNext: undefined | ((x: unknown) => unknown)
}

export function mountEventListeners(dom$: Stream<VNode>) {
  const DOM = useSources().DOM

  const tracker = makeUsageTrackerKeyed<
    [string | number, string],
    EventSubscription
  >({
    create([selector, eventName]) {
      let instance = {
        subscription: DOM.select(selector)
          .events(eventName)
          .subscribe({
            next(event) {
              if (instance.onNext) {
                instance.onNext(event)
              }
            },
          }),
        onNext: undefined,
      }

      return instance
    },
    use(instance) {
      return instance
    },
    destroy(instance) {
      instance.subscription.unsubscribe()
      instance.onNext = undefined
    },
  })
  onUnmount(tracker.destroy)

  return dom$.map((vnode) => {
    tracker.open()
    walkVTree(vnode, (node, path) => {
      if (isVNode(node)) {
        mountListeners(node, path)
      }
    })
    tracker.close()
    return vnode
  })

  function mountListeners(vnode: VNode, path: number[]) {
    if (isComponentDescription(vnode)) return
    let selector: string

    if (vnode.data?.ref) {
      selector = selector || createAndAssignSelector(vnode, path)
    }
    if (!vnode.data?.props) return

    Object.keys(vnode.data.props).forEach((prop) => {
      const isEventHandler = prop.startsWith('on') && isUpperCase(prop[2])
      if (!isEventHandler) return

      selector = selector || createAndAssignSelector(vnode, path)
      const eventName = prop.replace(/^on/, '').toLowerCase()
      let eventSubscription = tracker.track([selector, eventName])

      eventSubscription.onNext = vnode.data.props[prop]
      delete vnode.data.props[prop]
    })
  }
}

// this function mutates the provided vnode
function createAndAssignSelector(vNode: VNode, path): string {
  if (vNode.data?.ref) {
    vNode.data.attrs = vNode.data.attrs || {}
    vNode.data.attrs[vNode.data.ref.selector] = true

    return vNode.data.ref.selector
  }

  if (vNode.key) {
    const attribute = `l-key-${vNode.key}`

    vNode.data.attrs = vNode.data.attrs || {}
    vNode.data.attrs[attribute] = true

    return `[${attribute}]`
  }

  const id = vNode.data.attrs?.id || vNode.data.props?.id

  if (id) {
    return `#${id}`
  }

  const pathString = `0${path.length ? '-' + path.join('-') : ''}`
  const attribute = `l-${vNode.sel}-${pathString}`

  vNode.data.attrs = vNode.data.attrs || {}
  vNode.data.attrs[attribute] = true

  return `[${attribute}]`
}

function isUpperCase(val: string): boolean {
  return val.toUpperCase() === val
}
