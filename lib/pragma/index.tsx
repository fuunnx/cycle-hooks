// WIP
import { h, VNode } from "@cycle/dom";
import xs, { MemoryStream, Stream, Subscription } from "xstream";
import { isObservable, streamify } from "../helpers";
import { JSX } from "../../definitions";
import { Ref, safeUseRef, withRef } from "./ref";
import uponStop from "xstream-upon-stop";

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
    type: tagOrFunction,
    props,
    children,
  };
}

export function trackChildren(stream: VNode | Stream<VNode>): Stream<VNode> {
  const ref = safeUseRef() || Ref();

  return streamify(stream)
    .map((vtree) => {
      return withRef(ref, () => {
        return walk(vtree);
      });
    })
    .map(streamify)
    .flatten()
    .remember()
    .compose(
      uponStop(() => {
        ref.tracker.destroy();
      })
    );

  function walk(vnode: VNode) {
    if (!vnode) {
      return vnode;
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
