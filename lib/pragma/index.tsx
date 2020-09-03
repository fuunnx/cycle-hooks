import { h, VNode, rt } from '@cycle/dom'
import xs, { MemoryStream, Stream } from 'xstream'
import concat from 'xstream/extra/concat'
import { isObservable, streamify } from '../helpers'
import { JSX } from '../../definitions'
import { Ref, safeUseRef, withRef } from './ref'
import { Sources } from '../types'
import { assocPath } from 'rambda'

export type Component<T> = (
  sources: Sources & {
    props$: MemoryStream<T & { children: JSX.Element }>
  },
) => JSX.Element | { DOM: JSX.Element }

export function flattenObjectInnerStreams(props: object) {
  return xs
    .combine(
      ...Object.entries(props).map(([k, v]) => streamify(v).map((v) => [k, v])),
    )
    .map(Object.fromEntries)
}

type VnodeData = {
  props: { [k: string]: any }
  attrs?: { [k: string]: string }
  on?: { [k: string]: EventListener }
  class?: { [k: string]: boolean }
  key?: string
}
function normalizeProps(props: { [k: string]: any }) {
  let result: VnodeData = { props }
  if (props.on) {
    result.on = props.on
  }
  if (props.class) {
    result.class = props.class
  }
  if (props.attrs) {
    result.attrs = props.attrs
  }
  if (props.props) {
    result.props = props.props
  }
  if (props.key) {
    result.key = props.key
  }

  return result
}

export type ComponentDescription<T> = {
  _isComponent: true
  _function: Component<T>
  sel: string
  data: {
    props: T
    children: JSX.Element[]
  }
}
type WrappedComponent<T> = {
  (): Component<T>
  _props: T
  _isWrappedComponent: true
}

export function createElement<T extends { [k: string]: unknown }>(
  tagOrFunction: string | Component<T> | WrappedComponent<T>,
  props?: T,
  ...children: JSX.Element[]
): JSX.Element {
  if (typeof tagOrFunction === 'string') {
    if (props) {
      return h(tagOrFunction, normalizeProps(props), children as any)
    }
    return h(tagOrFunction, children)
  }

  return {
    _isComponent: true,
    _function:
      '_isWrappedComponent' in tagOrFunction ? tagOrFunction() : tagOrFunction,
    sel: tagOrFunction.name,
    data: {
      props: props || {},
      children,
    },
  }
}

function unwrapObjectStream(in$: Stream<JSX.Element>): Stream<VNode> {
  return in$
    .map((val) => {
      const nested = indexNestedStreams(val)
      return xs
        .combine(
          ...nested.map((x) =>
            x.value
              .compose(unwrapObjectStream)
              .map((unwrapped) => (acc) => assocPath(x.path, unwrapped, acc)),
          ),
        )
        .map((reducers) => reducers.reduce((acc, func) => func(acc), val))
    })
    .flatten()
}

type IndexedStream<T> = {
  path: (string | number)[]
  value: Stream<T>
}

function indexNestedStreams(input: any) {
  let indexed: IndexedStream<unknown>[] = []

  function run(value, path: (string | number)[]) {
    if (!value || typeof value !== 'object') return
    if (isObservable(value)) {
      indexed.push({
        value,
        path,
      })
      return
    }
    if (Array.isArray(value)) {
      value.forEach((x, index) => run(x, [...path, index]))
      return
    }
    Object.entries(value).forEach(([k, v]) => run(v, [...path, k]))
    return
  }

  run(input, [])

  return indexed
}

export function trackChildren(stream: VNode | Stream<VNode>): Stream<VNode> {
  const ref = safeUseRef() || Ref()
  const END = Symbol('END')

  return concat(unwrapObjectStream(streamify(stream)), xs.of(END as any))
    .map((vtree) => {
      return withRef(ref, () => {
        return walk(vtree)
      })
    })
    .filter((x) => x !== END)
    .map(streamify)
    .flatten()
    .remember()

  function walk(vnode: JSX.Element) {
    if (!vnode || typeof vnode !== 'object') {
      return vnode
    }
    if ('_isComponent' in vnode) {
      const childRef = ref.tracker.track(vnode._function)
      childRef.data.pushPropsAndChildren(
        (vnode as any).props,
        vnode.data.children as any,
      )
      return childRef.data.instance.DOM as any
    }

    if (vnode.children) {
      return xs
        .combine(...vnode.children.map(walk).map(streamify))
        .map((children) => {
          return {
            ...vnode,
            children,
          }
        })
    }
    return vnode
  }
}

export function Fragment(...children: JSX.Element[]): JSX.Element[] {
  return children.flat(Infinity).filter(Boolean)
}
