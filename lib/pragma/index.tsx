import { h } from '@cycle/dom'
import { ArgumentTypes } from 'rambda'
import { MemoryStream, Stream } from 'xstream'
import { JSX } from '../../definitions'
import { Sources } from '../types'

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
  sel: string
  data: {
    props: T
    children: JSX.Element[]
  }
}
export type WrappedComponent<Props> = {
  (jsxProps: Props): ReturnType<Component<Props>>
  // (...args: ArgumentTypes<Component<Props>>): ReturnType<Component<Props>>
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
    _function: tagOrFunction as Component<T>,
    sel: tagOrFunction.name,
    data: {
      props: props || {},
      children,
    },
  }
}

export function Fragment(...children: JSX.Element[]): JSX.Element[] {
  return children.flat(Infinity).filter(Boolean)
}
