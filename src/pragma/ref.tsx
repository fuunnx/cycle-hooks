import dropRepeats from 'xstream/extra/dropRepeats'
import xs, { Stream, MemoryStream } from 'xstream'
import {
  EffectName,
  withHandler,
  perform,
  performOrFailSilently,
} from 'performative-ts'
import { mapObj, streamify } from '../helpers'
import { withUnmount } from '../hooks/unmount'
import { mountInstances } from '../wrapper/mountInstances'
import { gatherEffect } from '../hooks/sinks'
import { useSources } from '../hooks'
import { IRef, Key, JSX } from './types'
import { shallowEquals } from '../helpers/shallowEquals'
import { makeUsageTrackerIndexed } from '../helpers/trackers/trackUsageIndexed'
import { makeUsageTrackerKeyed } from '../helpers/trackers/trackUsageKeyed'
import { mountEventListeners } from '../wrapper/mountEventListeners'

export function Ref(constructorFn?: Function): IRef {
  const destroy$ = xs.create()
  const props$: MemoryStream<Object> = xs.createWithMemory()
  const children$: Stream<
    (JSX.Element | Stream<JSX.Element>)[]
  > = xs.createWithMemory()

  const finalProps$ = xs
    .combine(
      props$.compose(dropRepeats(shallowEquals)),
      children$.map(streamify).flatten().compose(dropRepeats()),
    )
    .map(([props, children]) => ({ ...props, children }))
    .remember()

  const ref: IRef = {
    data: {
      constructorFn,
      instance: {},
      unmount() {},
      pushPropsAndChildren(props, children) {
        props$.shamefullySendNext(props)
        children$.shamefullySendNext(children)
      },
    },
    tracker: createTracker(),
  }

  if (constructorFn) {
    ref.data.instance = instanciateComponent()
  }

  return ref

  function instanciateComponent() {
    return withRef(ref, () => {
      const [unmount, result] = withUnmount(() => {
        const result = constructorFn({ ...useSources, props$: finalProps$ })
        const sinks = result.DOM ? result : { DOM: streamify(result) }

        const transformedSinks = mapObj(
          (sink$: Stream<any>) => sink$.endWhen(destroy$),
          sinks,
        )
        delete transformedSinks.DOM

        performOrFailSilently(gatherEffect, transformedSinks)

        return {
          ...transformedSinks,
          DOM: sinks.DOM.compose(mountEventListeners).compose(mountInstances),
        }
      }, 'component')
      ref.data.unmount = unmount

      return result
    })
  }

  function createTracker() {
    const lifecycle = {
      create(arg: [Function, Key] | Function) {
        return Ref(Array.isArray(arg) ? arg[0] : arg)
      },
      use(ref) {
        return ref
      },
      destroy(ref) {
        ref.data.unmount()
        destroy$.shamefullySendNext(null)
      },
    }
    const indexedTracker = makeUsageTrackerIndexed<Function, IRef>(lifecycle)
    const keyedTracker = makeUsageTrackerKeyed<[Function, Key], IRef>(lifecycle)

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
      track(type: Function, key?: Key) {
        if (key) {
          return keyedTracker.track([type, key])
        }
        return indexedTracker.track(type)
      },
    }
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
