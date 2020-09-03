import dropRepeats from 'xstream/extra/dropRepeats'
import xs, { Stream, MemoryStream } from 'xstream'
import { IndexedTracker, makeUsageTrackerIndexed } from './trackUsageIndexed'
import { ContextKey, withContext, useContext, safeUseContext } from '..'
import { mapObj, streamify } from '../helpers'
import { Sinks } from '../types'
import { withUnmount } from '../context/unmount'
import { trackChildren } from './trackChildren'
import { gathererKey } from '../context/sinks'
import { VNode } from '@cycle/dom'
import { useSources } from '../hooks'
import { JSX } from '../../definitions'

function flattenObjectInnerStreams(props?: object) {
  return xs
    .combine(
      ...Object.entries(props || {}).map(([k, v]) =>
        streamify(v).map((v) => [k, v]),
      ),
    )
    .map(Object.fromEntries)
}

export type Ref = {
  data: {
    instance: null | Sinks
    unmount: () => void
    constructorFn: Function | undefined
    pushPropsAndChildren: (
      props: object,
      children: (JSX.Element | Stream<JSX.Element>)[],
    ) => void
  }
  tracker: IndexedTracker<Function, Ref>
}

function shallowEquals(a: object, b: object) {
  if (a === b) return true
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => a[key] === b[key])
}

export function Ref(constructorFn?: Function): Ref {
  const destroy$ = xs.create()
  const props$: MemoryStream<Object> = xs.createWithMemory()
  const children$: Stream<
    (JSX.Element | Stream<JSX.Element>)[]
  > = xs.createWithMemory()
  const finalProps$ = xs
    .combine(
      props$
        .compose(dropRepeats(shallowEquals))
        .map(flattenObjectInnerStreams)
        .flatten() as Stream<object>,
      children$.map(streamify).flatten().compose(dropRepeats()),
    )
    .map(([props, children]) => ({ ...props, children }))
    .remember()

  const ref: Ref = {
    data: {
      constructorFn,
      instance: {},
      unmount() {},
      pushPropsAndChildren(props, children) {
        props$.shamefullySendNext(props)
        children$.shamefullySendNext(children)
      },
    },
    tracker: makeUsageTrackerIndexed<Function, Ref>({
      create(func) {
        return Ref(func)
      },
      use(ref) {
        return ref
      },
      destroy(ref) {
        ref.data.unmount()
        destroy$.shamefullySendNext(null)
      },
    }),
  }

  if (constructorFn) {
    ref.data.instance = withRef(ref, () => {
      const [unmount, result] = withUnmount(() => {
        const result = constructorFn({ ...useSources, props$: finalProps$ })
        const sinks = result.DOM ? result : { DOM: streamify(result) }

        const transformedSinks = mapObj(
          (sink$: Stream<any>) => sink$.endWhen(destroy$),
          sinks,
        )
        delete transformedSinks.DOM

        safeUseContext(gathererKey)?.(transformedSinks)

        return {
          ...transformedSinks,
          DOM: trackChildren(sinks.DOM).remember(),
        }
      }, 'component')
      ref.data.unmount = unmount

      return result
    })
  }

  return ref
}

export const refSymbol: ContextKey<Ref> = Symbol('ref')

export function withRef<T>(ref: Ref, exec: () => T): T {
  return withContext(refSymbol, ref, () => {
    return exec()
  })
}

export function useRef(): Ref {
  return useContext(refSymbol)
}
export function safeUseRef(): Ref {
  return safeUseContext(refSymbol)
}
