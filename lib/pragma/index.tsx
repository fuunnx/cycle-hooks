import { h, VNode, rt } from "@cycle/dom";
import xs, { MemoryStream, Stream } from "xstream";
import concat from "xstream/extra/concat";
import { isObservable, streamify } from "../helpers";
import { JSX } from "../../definitions";
import { Ref, safeUseRef, withRef } from "./ref";
import { Sources } from "../types";
import { assocPath } from "rambda";

export type Component<T> = (
  sources: Sources & {
    props$: MemoryStream<T & { children: JSX.Element }>;
  }
) => JSX.Element | { DOM: JSX.Element };

export function flattenObjectInnerStreams(props: object) {
  return xs
    .combine(
      ...Object.entries(props).map(([k, v]) =>
        (isObservable(v) ? v : xs.of(v)).map((v) => [k, v])
      )
    )
    .map(Object.fromEntries);
}

type VnodeData = {
  props: { [k: string]: any };
  attrs?: { [k: string]: string };
  on?: { [k: string]: EventListener };
  class?: { [k: string]: boolean };
  key?: string;
};
function normalizeProps(props: { [k: string]: any }) {
  let result: VnodeData = { props };
  if (props.on) {
    result.on = props.on;
  }
  if (props.class) {
    result.class = props.class;
  }
  if (props.attrs) {
    result.attrs = props.attrs;
  }
  if (props.props) {
    result.props = props.props;
  }
  if (props.key) {
    result.key = props.key;
  }

  return result;
}

export function createElement<T extends { [k: string]: unknown }>(
  tagOrFunction: string | Component<T>,
  props?: T,
  ...children: (string | null | number | JSX.Element)[]
) {
  if (typeof tagOrFunction === "string") {
    if (props) {
      if (Object.values(props).some(isObservable)) {
        return flattenObjectInnerStreams(props).map((props) =>
          liftIfObservable(children, (c) =>
            h(tagOrFunction, normalizeProps(props), c)
          )
        );
      }
      return liftIfObservable(children, (c) =>
        h(tagOrFunction, normalizeProps(props), c)
      );
    }
    return liftIfObservable(children, (c) => h(tagOrFunction, c));
  }

  return {
    _isComponent: true,
    type: (tagOrFunction as any)._isWrappedComponent
      ? (tagOrFunction as any)()
      : tagOrFunction,
    props: props || {},
    children: Fragment(...(children || [])),
  };
}

function unwrapObjectStream(in$: Stream<JSX.Element>): Stream<VNode> {
  return in$
    .map((val) => {
      const nested = indexNestedStreams(val);
      return xs
        .combine(
          ...nested.map((x) =>
            x.value
              .compose(unwrapObjectStream)
              .map((unwrapped) => (acc) => assocPath(x.path, unwrapped, acc))
          )
        )
        .map((reducers) => reducers.reduce((acc, func) => func(acc), val));
    })
    .flatten();
}

type IndexedStream<T> = {
  path: (string | number)[];
  value: Stream<T>;
};

function indexNestedStreams(input: any) {
  let indexed: IndexedStream<unknown>[] = [];

  function run(value, path: (string | number)[]) {
    if (!value || typeof value !== "object") return;
    if (isObservable(value)) {
      indexed.push({
        value,
        path,
      });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((x, index) => run(x, [...path, index]));
      return;
    }
    Object.entries(value).forEach(([k, v]) => run(v, [...path, k]));
    return;
  }

  run(input, []);

  return indexed;
}

export function trackChildren(stream: VNode | Stream<VNode>): Stream<VNode> {
  const ref = safeUseRef() || Ref();
  const END = Symbol("END");

  return concat(unwrapObjectStream(streamify(stream)), xs.of(END as any))
    .map((vtree) => {
      return withRef(ref, () => {
        return walk(vtree);
      });
    })
    .filter((x) => x !== END)
    .map(streamify)
    .flatten()
    .remember();

  function walk(vnode: VNode) {
    if (!vnode) {
      return vnode;
    }
    if ((vnode as any)._isComponent) {
      const childRef = ref.tracker.track((vnode as any).type);
      childRef.data.pushPropsAndChildren(
        (vnode as any).props,
        vnode.children as any
      );
      return childRef.data.instance.DOM as any;
    }
    if (vnode.children) {
      return xs
        .combine(...vnode.children.map(walk).map(streamify))
        .map((children) => {
          return {
            ...vnode,
            children,
          };
        });
    }
    return vnode;
  }
}

export function Fragment(
  ...children: (string | null | number | JSX.Element)[]
) {
  return liftIfObservable(children, (x) => x);
}

function liftIfObservable(
  children: (string | null | number | JSX.Element)[],
  func: (children: any[]) => JSX.Element | JSX.Element[]
): JSX.Element | JSX.Element[] | MemoryStream<JSX.Element | JSX.Element[]> {
  const childrenn = children.flat(Infinity).filter(Boolean) as any[];
  if (childrenn.some(isObservable)) {
    return flattenObservables(childrenn).map((children) => func(children));
  }
  return func(childrenn);
}

function flattenObservables(children: (any | Stream<any>)[]): Stream<VNode[]> {
  return xs
    .combine(...children.map(streamify))
    .map((x) => x.flat(Infinity).filter(Boolean))
    .map((children) =>
      children.some(isObservable)
        ? flattenObservables(children)
        : xs.of(children)
    )
    .flatten();
}
