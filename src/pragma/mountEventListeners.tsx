import { Stream } from 'xstream'
import { VNode } from '@cycle/dom'
import { useSources } from '../hooks'

export function mountEventListeners(dom$: Stream<VNode>) {
  const DOM = useSources().DOM

  // const tracker = makeUsageTrackerIndexed<[]>({
  //   create() {

  //   },
  //   use() {

  //   },
  //   destroy() {

  //   },
  // })

  // onUnmount(tracker.destroy)

  return dom$.map((vnode) => {
    mountListeners(vnode)
    return vnode
  })

  function mountListeners(vnode: VNode) {
    const key = vnode.data.props.id
    console.log(vnode.data)
    if (vnode.data.props) {
      Object.keys(vnode.data.props).forEach((prop) => {
        const isEventHandler =
          prop.startsWith('on') && (prop[2] || '').match(/[A-Z]/)
        if (!isEventHandler) {
          return
        }

        const callback = vnode.data.props[prop]
        delete vnode.data.props[prop]
        const eventName = prop.replace(/^on/, '').toLowerCase()
        const selector = '#' + key

        DOM.select(selector)
          .events(eventName)
          // .endWhen(onUnmount())
          .subscribe({ next: callback })
      })
    }
  }
}
