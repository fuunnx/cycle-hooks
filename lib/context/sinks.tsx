import "../patches/xstream";

import { Sinks } from "../types";
import xs, { Stream } from "xstream";
import { replicateMany } from "@cycle/run/lib/cjs/internals";
import { ContextKey, withContext, useContext } from ".";
import { onUnmount } from "./unmount";
import { mapObj } from "../helpers";

export type Registerer = (sinks: Sinks) => void;
export const gathererKey: ContextKey<Registerer> = Symbol("registerer");

export function sinksGatherer(keys: string[]) {
  function initSinksProxy(): { [key: string]: Stream<unknown> } {
    return Object.fromEntries(keys.map((key) => [key, xs.create()]));
  }

  return function gatherSinks<T>(exec: () => T): [Sinks, T] {
    let sinksProxy = initSinksProxy();
    let subscriptions: (() => void)[] = [];

    const returnValue = withContext(
      gathererKey,
      (sinks: Sinks) => {
        const unmount$ = onUnmount();
        subscriptions.push(
          replicateMany(
            mapObj((x$: Stream<any>) => x$.endWhen(unmount$), sinks),
            sinksProxy
          )
        );
      },
      exec
    );

    return [sinksProxy, returnValue];
  };
}

export function registerSinks(sinks: Sinks) {
  return useContext(gathererKey)(sinks);
}
