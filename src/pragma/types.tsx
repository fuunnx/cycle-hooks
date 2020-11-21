import { Sinks, Sources } from '../types'
import { Stream, MemoryStream } from 'xstream'

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

export type Component<T> = (
  sources: Sources & { props$: MemoryStream<T> },
) =>
  | JSX.Element
  | JSX.Element[]
  | Stream<JSX.Element | JSX.Element[]>
  | { DOM: Stream<JSX.Element | JSX.Element[]> }

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

import { VNode, VNodeData } from 'snabbdom/build/package/vnode'

export declare namespace JSX {
  type Element = string | null | number | VNode | ComponentDescription<unknown>

  interface IntrinsicElements {
    [elemName: string]: VNodeData
  }

  interface ElementChildrenAttribute {
    children: {} // specify children name to use
  }
}
