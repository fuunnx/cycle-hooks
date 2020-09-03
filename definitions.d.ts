import { VNode, VNodeData } from 'snabbdom/build/package/vnode'
import { ComponentDescription } from './lib/pragma'

declare namespace JSX {
  type Element = string | null | number | VNode | ComponentDescription<unknown>

  interface IntrinsicElements {
    [elemName: string]: VNodeData
  }

  interface ElementChildrenAttribute {
    children: {} // specify children name to use
  }
}
