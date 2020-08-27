import { h, VNode } from "@cycle/dom";
import xs, { MemoryStream, Stream } from "xstream";
import concat from "xstream/extra/concat";
import { isObservable, streamify } from "../helpers";
import { JSX } from "../../definitions";
import { Ref, safeUseRef, withRef } from "./ref";
import { Sources } from "../types";

export type Component<T> = (
  sources: Sources & {
    props$: MemoryStream<T & { children: JSX.Element | JSX.Element[] }>;
  }
) => JSX.Element | { DOM: MemoryStream<JSX.Element> };

export function flattenObjectInnerStreams(props: object) {
  return xs
    .combine(
      ...Object.entries(props).map(([k, v]) =>
        (isObservable(v) ? v : xs.of(v)).map((v) => [k, v])
      )
    )
    .map(Object.fromEntries);
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
            h(tagOrFunction, { on: (props.on as any) || {}, props }, c)
          )
        );
      }
      return liftIfObservable(children, (c) =>
        h(tagOrFunction, { on: (props.on as any) || {}, props }, c)
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

export function trackChildren(stream: VNode | Stream<VNode>): Stream<VNode> {
  const ref = safeUseRef() || Ref();
  const END = Symbol("END");

  return concat(streamify(stream), xs.of(END as any))
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
  if (children.some(isObservable)) {
    return flattenObservables(children).map((children) => func(children));
  }
  return func(children.flat().filter(Boolean) as any[]);
}

function flattenObservables(children: any[]) {
  if (children.some(isObservable)) {
    return xs
      .combine(...children.map(streamify))
      .map((x) => x.flat().filter(Boolean))
      .map((children) =>
        children.some(isObservable)
          ? flattenObservables(children)
          : xs.of(children)
      )
      .flatten();
  }
}
