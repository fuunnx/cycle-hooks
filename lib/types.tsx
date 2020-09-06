import { Stream } from 'xstream'

export type Sources = {
  [key: string]: any
}

export type Sinks = {
  [key: string]: Stream<unknown>
}

export type MainFn = {
  (sources?: Sources): Sinks
}

import { VNode, VNodeData } from 'snabbdom/build/package/vnode'
import { ComponentDescription } from './pragma'

export declare namespace JSX {
  type Element = string | null | number | VNode | ComponentDescription<unknown>

  interface IntrinsicElements {
    [elemName: string]: VNodeData
  }

  interface ElementChildrenAttribute {
    children: {} // specify children name to use
  }
}
