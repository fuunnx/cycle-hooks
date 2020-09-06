import { h, VNode } from '@cycle/dom'
import { MemoryStream, Stream } from 'xstream'
import { Sources, JSX } from '../types'
import { Key } from './ref'

export type Component<T> = (
  sources: Sources & { props$: MemoryStream<T> },
) =>
  | JSX.Element
  | JSX.Element[]
  | Stream<JSX.Element | JSX.Element[]>
  | { DOM: Stream<JSX.Element | JSX.Element[]> }

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
  data: {
    key: Key
    props: T
    children: JSX.Element[]
  }
}

export type WrappedComponent<Props> = (
  jsxProps: { [P in keyof Props]: Props[P] | Stream<Props[P]> } & { key?: Key },
) => ReturnType<Component<Props>>

export function createElement<T extends { [k: string]: unknown }>(
  tagOrFunction: string | Component<T> | WrappedComponent<T>,
  props?: T,
  ...children: JSX.Element[]
): JSX.Element {
  if (typeof tagOrFunction === 'string') {
    if (props) {
      return h(tagOrFunction, normalizeProps(props), children as VNode[])
    }
    return h(tagOrFunction, children)
  }

  return {
    _isComponent: true,
    _function: tagOrFunction as Component<T>,
    data: {
      ...normalizeProps(props || {}),
      children,
    },
  } as ComponentDescription<T>
}

export function Fragment(...children: JSX.Element[]): JSX.Element[] {
  return children.flat(Infinity).filter(Boolean)
}
