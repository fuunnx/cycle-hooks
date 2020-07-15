import { h } from "snabbdom";
import xs, { MemoryStream, Stream } from "xstream";
import { gatherSinks, registerSinks } from "./sinks";
import { provideSources, useSources } from "./sources";
import { map } from "rambda";

const components = new WeakMap();
const functions = new WeakMap();

export function createElement<T extends { [k: string]: unknown }>(
  tagOrFunction: string | ((props: T) => JSX.Element) | ((props: T) => MemoryStream<JSX.Element> | {DOM: MemoryStream<JSX.Element>}),
  props?: T,
  children?:
    | string
    | null
    | number
    | JSX.Element
    | (string | null | number | JSX.Element)[]
) {
  if (typeof tagOrFunction === "string") {
    return h(tagOrFunction, props, children);
  }

  if (components.has(tagOrFunction)) {
    const component = components.get(tagOrFunction);
    component.update({ ...props, children });
    return component.DOM;
  }

  if(functions.has(tagOrFunction)) {
    return tagOrFunction({ ...props, children });
  }


  const [sinks, returned] = gatherSinks(() => 
    provideSources(useSources(), () => tagOrFunction({ ...props, children }))
  );
  if(!returned || (!isObservable(returned) && !('DOM' in returned))) {
    functions.set(tagOrFunction, true)
    return returned 
  }

  const stop$ = xs.create()
  registerSinks(map(sink$ => sink$.endWhen(stop$), sinks))
  const component = {
    onDestroy() {
      components.get(tagOrFunction)
    },
    DOM: ('DOM' in returned) ? returned.DOM : returned 
  }

  return component.DOM
}

function isObservable<T>(x: T): (T is Stream) {
  return true
}