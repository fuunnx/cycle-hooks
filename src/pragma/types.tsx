import { Sinks } from '../types'
import { Stream } from 'xstream'
import { VNode, VNodeData } from 'snabbdom/build/package/vnode'

declare global {
  namespace JSX {
    type Element =
      | string
      | null
      | number
      | VNode
      | ComponentDescription
      | Sinks
      | Stream<JSX.Element>

    interface IntrinsicElements {
      [elemName: string]: VNodeData
    }

    interface ElementChildrenAttribute {
      children: {} // specify children name to use
    }
  }
}

export type Key = string | number | Symbol
export type Props = { [key: string]: unknown }

export type Component = {
  (props?: Record<string, unknown>): JSX.Element
  (): Sinks | Stream<JSX.Element>
}

export type ComponentDescription = {
  _isComponent: true
  _function: Component
  data: {
    key: Key
    props: Record<string, unknown>
    children: JSX.Element[]
  }
}
