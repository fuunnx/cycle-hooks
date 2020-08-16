// WIP
import { h } from "@cycle/dom";
import xs, { MemoryStream } from "xstream";
import { isObservable } from "../helpers";
import { JSX } from "../../definitions";
import { useRef } from "./ref";
import { values } from "rambda";

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
        console.log(props);
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

  try {
    const parent = useRef();
    const ref = parent.tracker.track(tagOrFunction);
    console.log(ref);
    return ref.data.instance.DOM;
  } catch (e) {
    console.error(e);
  }
}

export function Fragment(
  ...children: (string | null | number | JSX.Element)[]
) {
  console.log(children);
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
