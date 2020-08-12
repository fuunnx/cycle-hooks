// WIP
import { h } from "@cycle/dom";
import xs, { MemoryStream } from "xstream";
import { isObservable } from "../helpers";
import { JSX } from "../../definitions";
import { useRef } from "./ref";

export type Component<T> =
  | ((props: T) => JSX.Element)
  | ((
      props: T
    ) => MemoryStream<JSX.Element> | { DOM: MemoryStream<JSX.Element> });

export function createElement<T extends { [k: string]: unknown }>(
  tagOrFunction:
    | string
    | ((props: T) => JSX.Element)
    | ((
        props: T
      ) => MemoryStream<JSX.Element> | { DOM: MemoryStream<JSX.Element> }),
  props?: T,
  ...children: (string | null | number | JSX.Element)[]
) {
  if (typeof tagOrFunction === "string") {
    if (props) {
      return liftIfObservable((c) => h(tagOrFunction, props, c));
    }
    return liftIfObservable((c) => h(tagOrFunction, c));
  }

  const parent = useRef();
  const ref = parent.tracker.track(tagOrFunction);

  return ref.data.DOM;

  function liftIfObservable(
    func: (children: JSX.Element[]) => JSX.Element
  ): JSX.Element | MemoryStream<JSX.Element> {
    if (children.some(isObservable)) {
      return xs
        .combine(...children.map((x) => (isObservable(x) ? x : xs.of(x))))
        .map(func);
    }
    return func(children as any[]);
  }
}
