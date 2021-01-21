import dropRepeats from 'xstream/extra/dropRepeats'
import xs, { Stream } from 'xstream'
import {
  EffectName,
  withHandler,
  perform,
  performOrFailSilently,
  withFrame,
} from 'performative-ts'
import { streamify } from '../libs/isObservable'
import { mapObj } from '../libs/mapObj'
import { onUnmount, withUnmount } from '../hooks/unmount'
import { mountInstances } from './mountInstances'
import { provideSinksEff, readGatherableEff } from '../hooks/sinks'
import { useSources } from '../hooks/sources'
import { Key, ComponentDescription } from '../pragma/types'
import { shallowEquals } from '../libs/shallowEquals'
import { makeUsageTrackerIndexed } from '../libs/trackers/trackUsageIndexed'
import { makeUsageTrackerKeyed } from '../libs/trackers/trackUsageKeyed'
import { mountEventListeners } from './mountEventListeners'
import { Sinks } from '../types'
import { withHooks } from '.'
import isolate from '@cycle/isolate'
import { TrackingLifecycle } from '../libs/trackers/trackUsage'
import { VNode } from 'snabbdom/build/package/vnode'
import { useMemorySubject } from '../hooks/subject'
import { useID } from '../hooks/id'

type RefTracker = {
  open(): void
  close(): void
  destroy(): void
  track(
    type: Function,
    key?: Key,
    componentDescription?: ComponentDescription,
  ): IRef
}

export type IRef = {
  data: {
    sinks: null | Sinks
    unmount: () => void
    componentDescription?: ComponentDescription
    update: (newComponentDescription: ComponentDescription) => void
    currentVTree?: VNode
    domCallback?: (dom: VNode) => void
  }
  trackers: RefTracker[]
}

export function Ref(componentDescription?: ComponentDescription): IRef {
  const constructorFn = componentDescription?.$func$
  const componentData = componentDescription?.data
  const componentFrame = componentDescription?.$frame$

  const [props$, setProps] = useMemorySubject(componentDescription?.data.props)
  const [children$, setChildren] = useMemorySubject(
    componentDescription?.data.children,
  )

  const finalProps$ = xs
    .combine(
      props$.compose(dropRepeats(shallowEquals)),
      children$.compose(dropRepeats(shallowEquals)),
    )
    .map(([props, children]) => ({ ...props, children }))
    .remember()

  const ref: IRef = {
    data: {
      sinks: {},
      unmount() {
        ref.trackers.forEach((x) => x.destroy())
      },
      componentDescription,
      update(newComponentDescription) {
        this.componentDescription = newComponentDescription
        setProps(newComponentDescription.data.props)
        setChildren(newComponentDescription.data.children)
      },
    },
    trackers: [],
  }

  if (constructorFn) {
    ref.data.sinks = instanciateComponent()
  }

  return ref

  function instanciateComponent() {
    return withFrame(componentFrame, () =>
      withRef(ref, () => {
        const [unmount, result] = withUnmount(() => {
          const sources = {
            ...useSources(),
            props$: finalProps$,
          }

          const sinks = isolate(
            withHooks(() => {
              const result: any = constructorFn(componentData.props)
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
          )(sources) as Sinks

          const { DOM, props$, ...otherSinks } = sinks

          if (Object.keys(otherSinks).length) {
            performOrFailSilently(provideSinksEff, otherSinks)
          }

          return sinks
        }, 'component')

        let domSubscription = result.DOM?.subscribe({
          next(dom: any) {
            ref.data.currentVTree = dom
            ref.data.domCallback?.(dom)
          },
        })

        ref.data.unmount = () => {
          domSubscription?.unsubscribe()
          ref.trackers.forEach((x) => x.destroy())
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
    IRef,
    [ComponentDescription]
  > = {
    create(_, componentDescription) {
      return Ref(componentDescription)
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
    IRef,
    [ComponentDescription]
  >(lifecycle)

  const keyedTracker = makeUsageTrackerKeyed<
    [Function, Key],
    IRef,
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

export const readRefEffect: EffectName<() => IRef> = Symbol('ref')

export function withRef<T>(ref: IRef, exec: () => T): T {
  return withHandler([readRefEffect, () => ref], exec)
}

export function useRef(): IRef {
  return perform(readRefEffect)
}
export function safeUseRef(): IRef {
  return performOrFailSilently(readRefEffect)
}
