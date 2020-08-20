// WIP
import { h, VNode } from "@cycle/dom";
import xs, { MemoryStream, Stream } from "xstream";
import { isObservable, streamify } from "../helpers";
import { JSX } from "../../definitions";
import { Ref, safeUseRef } from "./ref";

export type Component<T> = (
  props: T
) =>
  | JSX.Element
  | MemoryStream<JSX.Element>
  | { DOM: MemoryStream<JSX.Element> };

export function createElement<T extends { [k: string]: unknown }>(
  tagOrFunction: string | Component<T>,
  props?: T,
  ...children: (string | null | number | JSX.Element)[]
) {
  if (typeof tagOrFunction === "string") {
    if (props) {
      if (Object.values(props).some(isObservable)) {
        return xs
          .combine(
            ...Object.entries(props).map(([k, v]) =>
              (isObservable(v) ? v : xs.of(v)).map((v) => [k, v])
            )
          )
          .map(Object.fromEntries)
          .map((props) =>
            liftIfObservable(children, (c) => h(tagOrFunction, props, c))
          );
      }
      return liftIfObservable(children, (c) => h(tagOrFunction, props, c));
    }
    return liftIfObservable(children, (c) => h(tagOrFunction, c));
  }

  return {
    _isComponent: true,
    type: tagOrFunction,
    props,
    children,
  };
}

export function trackChildren(stream: VNode | Stream<VNode>): Stream<VNode> {
  const ref = safeUseRef() || Ref();

  return streamify(stream)
    .map((vtree) => {
      ref.tracker.open();
      const res = walk(vtree);
      ref.tracker.close();
      return res;
    })
    .map(streamify)
    .flatten()
    .remember();

  function walk(vnode: VNode) {
    if (!vnode) {
      return xs.of(vnode);
    }
    if ((vnode as any)._isComponent) {
      return ref.tracker.track((vnode as any).type).data.instance.DOM as any;
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
    return xs.of(vnode);
  }
}

function mount<T>(component: Component<T>, props: T) {
  const sinks = component(props);

  if ("DOM" in sinks) {
    return sinks.DOM;
  }

  return sinks;
}

export function Fragment(
  ...children: (string | null | number | JSX.Element)[]
) {
  return liftIfObservable(children, (x) => x);
}

function liftIfObservable(
  children: (string | null | number | JSX.Element)[],
  func: (children: JSX.Element[]) => JSX.Element | JSX.Element[]
): JSX.Element | JSX.Element[] | MemoryStream<JSX.Element | JSX.Element[]> {
  if (children.some(isObservable)) {
    return flattenObservables(children).map((children) => func(children));
  }
  return func(children.flat() as any[]);
}

function flattenObservables(children: any[]) {
  if (children.some(isObservable)) {
    return xs
      .combine(...children.map((x) => (isObservable(x) ? x : xs.of(x))))
      .map((x) => x.flat())
      .map((children) =>
        children.some(isObservable)
          ? flattenObservables(children)
          : xs.of(children)
      )
      .flatten();
  }
}
