import dropRepeats from 'xstream/extra/dropRepeats'
import xs, { Stream } from 'xstream'
import {
  EffectName,
  withHandler,
  perform,
  performOrFailSilently,
  withFrame,
} from 'performative-ts'
import { streamify } from './libs/isObservable'
import { mapObj } from '../libs/mapObj'
import {
  onUnmount,
  RegisterUnmountCallback,
  withUnmount,
} from '../withEffects/unmount'
import { mountInstances } from './mountInstances'
import { useSources } from '../effects/sources'
import { Key, ComponentDescription } from './types'
import { shallowEquals } from './libs/shallowEquals'
import { makeUsageTrackerIndexed } from './libs/trackers/trackUsageIndexed'
import { makeUsageTrackerKeyed } from './libs/trackers/trackUsageKeyed'
import { mountEventListeners } from './mountEventListeners'
import { AnySinks } from '../types'
import { withEffects } from '../withEffects'
import isolate from '@cycle/isolate'
import { TrackingLifecycle } from './libs/trackers/trackUsage'
import { VNode } from 'snabbdom/build/package/vnode'
import { useID } from '../effects/id'

const registerComponentUnmountSymbol: EffectName<RegisterUnmountCallback> = Symbol(
  'registerComponentUnmount',
)

type RefTracker = {
  open(): void
  close(): void
  destroy(): void
  track(
    type: Function,
    key?: Key,
    componentDescription?: ComponentDescription,
  ): IInstance
}

export type IInstance = {
  data: {
    sinks: null | AnySinks
    unmount: () => void
    componentDescription?: ComponentDescription
    update: (newComponentDescription: ComponentDescription) => void
    currentVTree?: VNode
    domCallback?: (dom: VNode) => void
  }
  trackers: RefTracker[]
}

export function Instance(
  componentDescription?: ComponentDescription,
): IInstance {
  const component = componentDescription?.$func$
  const data = componentDescription?.data
  const frame = componentDescription?.$frame$

  const props$ = xs.create().startWith({
    ...data.props,
    children: data.children,
  })

  const finalProps$ = props$.compose(dropRepeats(shallowEquals)).remember()

  const instance: IInstance = {
    data: {
      sinks: {},
      unmount() {
        instance.trackers.forEach((x) => x.destroy())
      },
      componentDescription,
      update(newComponentDescription) {
        this.componentDescription = newComponentDescription
        props$.shamefullySendNext({
          ...componentDescription?.data.props,
          children: componentDescription?.data.children,
        })
      },
    },
    trackers: [],
  }

  if (component) {
    instance.data.sinks = instanciateComponent()
  }

  return instance

  function instanciateComponent() {
    return withFrame(frame, () =>
      withInstance(instance, () => {
        const [unmount, result] = withUnmount(() => {
          return isolate(
            withEffects(() => {
              const result: any = component(finalProps$ as any)
              const sinks = result.DOM ? result : { DOM: streamify(result) }
              const transformedSinks = mapObj(
                (sink$: Stream<any>) => sink$.endWhen(onUnmount()),
                sinks,
              )

              return {
                ...transformedSinks,
                DOM: sinks.DOM.compose(mountEventListeners).compose(
                  mountInstances,
                ),
              }
            }),
            { DOM: useID(), '*': null },
          )(useSources()) as AnySinks
        }, registerComponentUnmountSymbol)

        let domSubscription = result.DOM?.subscribe({
          next(dom: any) {
            instance.data.currentVTree = dom
            instance.data.domCallback?.(dom)
          },
        })

        instance.data.unmount = () => {
          domSubscription?.unsubscribe()
          instance.trackers.forEach((x) => x.destroy())
          unmount()
        }

        return result
      }),
    )
  }
}

export function createRefTracker() {
  const lifecycle: TrackingLifecycle<
    [Function, Key] | Function,
    IInstance,
    [ComponentDescription]
  > = {
    create(_, componentDescription) {
      return Instance(componentDescription)
    },
    use(ref, _, componentDescription) {
      ref.data.update(componentDescription)
      return ref
    },
    destroy(ref) {
      ref.data.unmount()
    },
  }

  const indexedTracker = makeUsageTrackerIndexed<
    Function,
    IInstance,
    [ComponentDescription]
  >(lifecycle)

  const keyedTracker = makeUsageTrackerKeyed<
    [Function, Key],
    IInstance,
    [ComponentDescription]
  >(lifecycle)

  return {
    open() {
      indexedTracker.open()
      keyedTracker.open()
    },
    close() {
      indexedTracker.close()
      keyedTracker.close()
    },
    destroy() {
      indexedTracker.destroy()
      keyedTracker.destroy()
    },
    track(
      type: Function,
      key: Key,
      componentDescription?: ComponentDescription,
    ) {
      if (key) {
        return keyedTracker.track([type, key], componentDescription)
      }
      return indexedTracker.track(type, componentDescription)
    },
  }
}

export const getInstanceSymbol: EffectName<() => IInstance> = Symbol(
  'getInstance',
)

export function withInstance<T>(instance: IInstance, exec: () => T): T {
  return withHandler([getInstanceSymbol, () => instance], exec)
}

export function getInstance(): IInstance {
  return perform(getInstanceSymbol)
}
export function safeGetInstance(): IInstance | undefined {
  return performOrFailSilently(getInstanceSymbol)
}

export function onComponentUnmount(callback: () => void = () => {}) {
  const unmount$ = xs.create()
  let unmounted = false
  performOrFailSilently(registerComponentUnmountSymbol, () => {
    if (unmounted) return

    callback()
    unmount$.shamefullySendNext(null)

    unmounted = true
  })
  return unmount$
}
