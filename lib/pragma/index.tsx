// WIP
import { h } from "@cycle/dom";
import xs, { MemoryStream } from "xstream";
import { ContextKey, useContext, withContext } from "../context";

export type Component<T> =
  | ((props: T) => JSX.Element)
  | ((
      props: T
    ) => MemoryStream<JSX.Element> | { DOM: MemoryStream<JSX.Element> });

export type Ref = {
  commit: () => void;
  unMount: () => void;
  fetchChild<T>(Component: Component<T>, key?: string): Ref;
  properties: { [k: string]: any };
  isNew: boolean;
};

export const refSymbol: ContextKey<Ref> = Symbol("ref");

export function withRef<T>(ref: Ref, exec: () => T): T {
  return withContext(refSymbol, ref, () => {
    try {
      return exec();
    } finally {
      ref.commit();
    }
  });
}
export function useRef(): Ref {
  return useContext(refSymbol);
}

function tasks() {
  let index = -1;
  let store: Ref[] = [];
  let newTasks: Ref[] = [];
  return {
    pull(): Ref | undefined {
      return store[index++];
    },
    reserve(task: Ref) {
      newTasks.push(task);
    },
    commit() {
      store.slice(index + 1).forEach((ref) => {
        ref.unMount();
      });
      store = newTasks;
      newTasks = [];
      index = -1;
    },
    unMount() {
      store.forEach((task) => task.unMount());
      newTasks.forEach((task) => task.unMount());
    },
  };
}
type Tasks<T> = {
  pull(): T | undefined;
  reserve(task: T): void;
  commit(): void;
  unMount(): void;
};

export function Ref(): Ref {
  const keyed = new Map();
  let keysToFlush = new Set();
  let didRun = false;
  const components: Map<Component<unknown>, Tasks<Ref>> = new Map();

  return {
    fetchChild(component, key) {
      didRun = true;
      if (key) {
        if (!keyed.has(key)) {
          keyed.set(key, Ref());
        }
        keysToFlush.delete(key);
        return keyed.get(key);
      }
      if (!components.has(component)) {
        components.set(component, tasks());
      }
      const childList = components.get(component);
      const child = childList.pull() || Ref();
      childList.reserve(child);
      return child;
    },
    commit() {
      if (didRun) {
        keysToFlush.forEach((key) => {
          keyed.get(key).unMount();
          keyed.delete(key);
        });
        keysToFlush = new Set(keyed.keys());

        components.forEach((tasks) => {
          tasks.commit();
        });
      }
      this.isNew = false;
      didRun = false;
    },
    unMount() {
      components.forEach((tasks) => {
        tasks.unMount();
        keyed.forEach((ref) => ref.unMount());
      });
    },
    properties: {},
    isNew: true,
  };
}

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
  const ref = parent.fetchChild(tagOrFunction, (props as any)?.key);
  if (ref.isNew) {
    ref.properties.instance = withRef(ref, () =>
      initInstance(tagOrFunction, props)
    ); // TODO
  } else {
    ref.properties.instance.pushProps(props);
  }
  ref.commit();

  console.log(ref.properties.instance.DOM);
  return ref.properties.instance.DOM;

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

function initInstance<T>(component: Component<T>, props?: T) {
  const sinks = component(props);
  const DOM = isObservable(sinks) ? sinks : (sinks as any).DOM;

  return {
    DOM: DOM as MemoryStream<any>,
    pushProps(props?: T) {
      // TODO
    },
    unMount() {},
  };
}

import { VNode, VNodeData } from "snabbdom/build/package/vnode";
import { isObservable } from "../helpers";

declare namespace JSX {
  interface Element extends VNode {}

  interface IntrinsicElements {
    [elemName: string]: VNodeData;
  }

  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }
}
