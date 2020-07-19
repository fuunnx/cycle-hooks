import "./patches/xstream";

import { Sinks } from "./types";
import xs, { Stream } from "xstream";
import { mapObj } from "./helpers";
import { replicateMany } from "@cycle/run/lib/cjs/internals";

export type Registerer<S extends Sinks> = (sinks: S) => void;

let globalSinks = {
  register: null,
};
export function sinksGatherer(keys: string[]) {
  function initSinksProxy(): { [key: string]: Stream<unknown> } {
    return Object.fromEntries(keys.map((key) => [key, xs.create()]));
  }

  return function gatherSinks<T>(exec: () => T): [Sinks, T] {
    let sinksProxy = initSinksProxy();
    let subscriptions = [];
    const returnValue = withSinksRegisterer((sinks: Sinks) => {
      console.log("registering", Object.keys(sinks));
      subscriptions.push(replicateMany(sinks, sinksProxy));
    }, exec);

    return [sinksProxy, returnValue];
  };
}

export function safeUseRegisterer<S extends Sinks>() {
  return globalSinks.register as Registerer<S> | null;
}
export function useRegisterer<S extends Sinks>() {
  const registerer = safeUseRegisterer();
  if (!registerer) throw new Error("nop");
  return registerer as Registerer<S>;
}

export function withSinksRegisterer<T, S extends Sinks>(
  registerer: Registerer<S>,
  func: () => T
) {
  let previous = globalSinks.register;
  globalSinks.register = registerer;
  const returnValue = func();
  globalSinks.register = previous;

  return returnValue;
}

export function registerSinks(sinks: Sinks) {
  const stop$ = useUnmount();
  return useRegisterer()(
    mapObj((sink$: Stream<unknown>) => sink$.endWhen(stop$), sinks)
  );
}

function useUnmount() {
  return xs.never();
}
