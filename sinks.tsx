import "./patches/xstream";

import { Sinks } from "./types";
import xs, { Stream } from "xstream";
import { mapObj } from "./helpers";
import { replicateMany } from "@cycle/run/lib/cjs/internals";
import { ContextKey, withContext, useContext, safeUseContext } from "./context";

export type Registerer = (sinks: Sinks) => void;
export const registererKey: ContextKey<Registerer> = Symbol("registerer");

export function sinksGatherer(keys: string[]) {
  function initSinksProxy(): { [key: string]: Stream<unknown> } {
    return Object.fromEntries(keys.map((key) => [key, xs.create()]));
  }

  return function gatherSinks<T>(exec: () => T): [Sinks, T] {
    let sinksProxy = initSinksProxy();
    let subscriptions = [];
    const returnValue = withContext(
      registererKey,
      (sinks: Sinks) => {
        // console.log("registering", Object.keys(sinks));
        subscriptions.push(replicateMany(sinks, sinksProxy));
      },
      exec
    );

    return [sinksProxy, returnValue];
  };
}

export function registerSinks(sinks: Sinks) {
  const stop$ = useUnmount();
  return useContext(registererKey)(
    mapObj((sink$: Stream<unknown>) => sink$.endWhen(stop$), sinks)
  );
}

function useUnmount() {
  return xs.never();
}
