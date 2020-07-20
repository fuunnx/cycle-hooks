import { Stream } from "xstream";

export { Stream } from "xstream";
export type Sources = {};

export type Sinks = {
  [key: string]: Stream<unknown>;
};

export type MainFn = {
  (sources?: Sources): Sinks;
};

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }

  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }
}
