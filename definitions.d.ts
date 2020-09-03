import { VNode, VNodeData } from 'snabbdom/build/package/vnode'
import { Stream } from 'xstream'
import { ComponentDescription } from './lib/pragma'

declare namespace JSX {
  type Element = string | null | number | VNode | ComponentDescription<unknown>

  interface IntrinsicElements {
    [elemName: string]: VNodeData
  }

  interface ElementChildrenAttribute {
    children: {} // specify children name to use
  }

  interface ElementClass {
    _props: any
  }

  interface ElementAttributesProperty {
    _props // specify the property name to use
  }
}
