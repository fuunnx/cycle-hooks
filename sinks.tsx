import { Sinks } from "./types";
import xs, { Stream } from "xstream";
import { mapObj } from "./helpers";
import { replicateMany } from "@cycle/run/lib/cjs/internals";

let globalSinks = {
  register: null,
};
export function sinksGatherer(keys: string[]) {
  function initSinksProxy(): { [key: string]: Stream<unknown> } {
    return Object.fromEntries(keys.map((key) => [key, xs.create()]));
  }

  return function gatherSinks<T>(func: () => T): [Sinks, T] {
    let previous = globalSinks.register;
    let sinksProxy = initSinksProxy();
    let subscriptions = [];
    globalSinks.register = function registerSinks(sinks: Sinks) {
      subscriptions.push(replicateMany(sinks, sinksProxy));
    };
    const returnValue = func();
    globalSinks.register = previous;

    return [sinksProxy, returnValue];
  };
}

export function registerSinks(sinks: Sinks) {
  if (!globalSinks.register) throw new Error("nop");
  const stop$ = useUnmount();
  return globalSinks.register(
    mapObj((sink$: Stream<unknown>) => sink$.endWhen(stop$), sinks)
  );
}

function useUnmount() {
  return xs.never();
}
