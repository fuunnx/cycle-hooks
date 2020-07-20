import { h } from "snabbdom";
import { MemoryStream, Stream } from "xstream";
import { registerSinks } from "./sinks";
import { sourcesKey } from "./sources";
import { ContextKey, forkZone, useContext, useCurrentZone, withContext, withZone } from "./context";
import { Sinks, Sources } from "./types";

const components = new WeakMap();
const functions = new WeakMap();

export type Component<T> = ((props: T) => JSX.Element) | ((props: T) => MemoryStream<JSX.Element> | {DOM: MemoryStream<JSX.Element>})

export type Ref = {
  commit: () => void
  unMount: () => void
  fetchChild<T>(Component: Component<T>, key: string | undefined): Ref,
  properties: {[k: string]: any}
  isNew: boolean
}


export const refSymbol: ContextKey<Ref> = Symbol('ref')

export function withRef<T>(ref: Ref, exec: () => T): T {
  return withContext(refSymbol, ref, () => {
    try {
      return exec()
    } finally {
      ref.commit()
    }
  })
}
export function useRef(): Ref {
  return useContext(refSymbol)
}

function tasks() {
  let index = -1
  let store: Ref[] = []
  let newTasks: Ref[] = []
  return {
    pull(): Ref | undefined {
      return store[index++]
    },
    reserve(task: Ref) {
      newTasks.push(task)
    },
    commit() {
      store.slice(index + 1).forEach((ref) => {
        ref.unMount()
      })
      store = newTasks
      newTasks = []
      index = -1
    },
    unMount() {
      store.forEach(task => task.unMount())
      newTasks.forEach(task => task.unMount())
    }
  }
}
type Tasks<T> = {
  pull(): T | undefined
  reserve(task:T): void
  commit(): void
  unMount(): void
}

export function Ref(): Ref {
  const keyed = new Map()
  let keysToFlush = new Set()
  let didRun = false
  const components: Map<Component<unknown>, Tasks<Ref>> = new Map()

  return {
    fetchChild(component, key) {
      didRun = true
      if(key) {
        if(!keyed.has(key)) {
          keyed.set(key, Ref())
        }
        keysToFlush.delete(key)
        return keyed.get(key)
      }
      if(!components.has(component)) {
        components.set(component, tasks())
      }
      const childList = components.get(component)
      const child = childList.pull() || Ref()
      childList.reserve(child)
      return child
    },
    commit() {
      if(didRun) {
        keysToFlush.forEach((key) => {
          keyed.get(key).unMount()
          keyed.delete(key)
        })
        keysToFlush = new Set(keyed.keys())
  
        components.forEach(tasks => {
          tasks.commit()
        })
      }
      this.isNew = false
      didRun = false
    },
    unMount() {
      components.forEach(tasks => {
        tasks.unMount()
        keyed.forEach(ref => ref.unMount())
      })
    },
    properties: {},
    isNew: true,
  }
}

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

  const parent = useRef()
  const ref = parent.fetchChild(tagOrFunction, (props as any).key)
  if(ref.isNew) {
    ref.properties.instance = withRef(ref, () => initInstance(tagOrFunction, props)) // TODO
  } else {
    ref.properties.instance.pushProps(props)
  }
  ref.commit()

  return ref.properties.instance.DOM

  // if (components.has(tagOrFunction)) {
  //   const component = components.get(tagOrFunction);
  //   component.update({ ...props, children });
  //   return component.DOM;
  // }

  // if(functions.has(tagOrFunction)) {
  //   return tagOrFunction({ ...props, children });
  // }


  // const [sinks, returned] = gatherSinks(() => 
  //   provideSources(useSources(), () => tagOrFunction({ ...props, children }))
  // );
  // if(!returned || (!isObservable(returned) && !('DOM' in returned))) {
  //   functions.set(tagOrFunction, true)
  //   return returned 
  // }

  // const stop$ = xs.create()
  // registerSinks(map((sink$: Stream<unknown>) => sink$.endWhen(stop$), sinks))
  // const component = {
  //   onDestroy() {
  //     components.get(tagOrFunction)
  //   },
  //   DOM: ('DOM' in returned) ? returned.DOM : returned 
  // }

  // return component.DOM
}

function isObservable<T>(x: T): (T is Stream) {
  return true
}

function initInstance<T>(component: Component<T>, props?: T) {
  const sinks = component(props)
  const DOM = isObservable(sinks) ? sinks : sinks.DOM

  return {
    DOM: DOM as MemoryStream<any>,
    pushProps(props?: T) {
      // TODO
    },
    unMount() {

    },
  }
}