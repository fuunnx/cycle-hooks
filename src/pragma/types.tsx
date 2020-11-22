import { Sinks } from '../types'
import { Stream } from 'xstream'
import { VNode, VNodeData } from 'snabbdom/build/package/vnode'

declare global {
  namespace JSX {
    type Element = string | null | number | VNode | ComponentDescription | Sinks

    interface IntrinsicElements {
      [elemName: string]: VNodeData
    }

    interface ElementChildrenAttribute {
      children: {} // specify children name to use
    }
  }
}

export type Key = string | number | Symbol
export type IRef = {
  data: {
    instance: null | Sinks
    unmount: () => void
    constructorFn: Function | undefined
    pushPropsAndChildren: (
      props: object,
      children: (JSX.Element | Stream<JSX.Element>)[],
    ) => void
  }
  tracker: {
    open(): void
    close(): void
    destroy(): void
    track(type: Function, key?: Key): IRef
  }
}

export type Component = () => Sinks

export type ComponentDescription = {
  _isComponent: true
  _function: Component
  data: {
    key: Key
    props: Record<string, unknown>
    children: JSX.Element[]
  }
}
