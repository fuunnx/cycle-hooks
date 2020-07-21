declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }

  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }
}
