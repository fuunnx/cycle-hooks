import { VNode, VNodeData } from "snabbdom/build/package/vnode";
import { MemoryStream } from "xstream";

declare namespace JSX {
  type Element = VNode | MemoryStream<VNode>;

  interface IntrinsicElements {
    [elemName: string]: VNodeData;
  }

  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }

  interface ElementClass {
    _props: any;
  }

  interface ElementAttributesProperty {
    _props; // specify the property name to use
  }
}
