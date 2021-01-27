import { AnySinks } from '../types'
import { Stream } from 'xstream'
import { VNode, VNodeData } from 'snabbdom/build/package/vnode'
import { Frame } from 'performative-ts'
import { Ref } from './ref'

declare global {
  namespace JSX {
    type Element =
      | string
      | null
      | number
      | VNode
      | ComponentDescription
      | AnySinks
      | Stream<JSX.Element>

    interface IntrinsicElements {
      [elemName: string]: VNodeData
      ref: Ref
    }

    interface ElementChildrenAttribute {
      children: {} // specify children name to use
    }
  }
}

export type Key = string | number | Symbol
export type Props = { [key: string]: unknown }

export type Component = {
  (
    props?: Record<string, unknown> | Stream<Record<string, unknown>>,
  ): JSX.Element
  (): AnySinks | Stream<JSX.Element>
}

export type ComponentDescription = {
  $type$: 'component'
  $func$: Component
  $frame$: Frame
  data: {
    key: Key
    props: Record<string, unknown>
    children: JSX.Element[]
  }
}
