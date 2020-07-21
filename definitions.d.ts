import { VNode, VNodeData } from "snabbdom/build/package/vnode";

declare namespace JSX {
  interface Element extends VNode {}

  interface IntrinsicElements {
    [elemName: string]: VNodeData;
  }

  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }
}
