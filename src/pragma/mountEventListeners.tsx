import { Stream, Subscription } from 'xstream'
import { useSources } from '../hooks'
import { walkVTree, isVNode } from '../helpers/VTree'
import { VNode } from 'snabbdom/build/package/vnode'
import { onUnmount } from '../hooks/unmount'
import { makeUsageTrackerKeyed } from '../helpers/trackers/trackUsageKeyed'

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
    let selector: string

    if (vnode.data.props) {
      Object.keys(vnode.data.props).forEach((prop) => {
        const isEventHandler = prop.startsWith('on') && isUpperCase(prop[2])
        if (!isEventHandler) {
          return
        }
        selector = selector || createAndAssignSelector(vnode, path)

        const eventName = prop.replace(/^on/, '').toLowerCase()
        let eventSubscription = tracker.track([selector, eventName])

        eventSubscription.onNext = vnode.data.props[prop]
        delete vnode.data.props[prop]
      })
    }
  }
}

function createAndAssignSelector(vNode: VNode, path): string {
  const id = vNode.data.attrs?.id || vNode.data.props?.id
  if (id) {
    return `#${id}`
  }

  if (vNode.key) {
    const attribute = `data-$-key-${vNode.key}`

    vNode.data.attrs = vNode.data.attrs || {}
    vNode.data.attrs[attribute] = true

    return `[${attribute}]`
  }

  const pathString = `0${path.length ? '-' + path.join('-') : ''}`
  const attribute = `data-$-${vNode.sel}-${pathString}`

  vNode.data.attrs = vNode.data.attrs || {}
  vNode.data.attrs[attribute] = true

  return `[${attribute}]`
}

function isUpperCase(val: string): boolean {
  return val.toUpperCase() === val
}
