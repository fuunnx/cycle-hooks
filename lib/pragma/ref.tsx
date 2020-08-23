import xs, { Stream } from "xstream";
import { IndexedTracker, makeUsageTrackerIndexed } from "./trackUsageIndexed";
import { ContextKey, withContext, useContext, safeUseContext } from "..";
import { mapObj, streamify } from "../helpers";
import { Sinks } from "../types";
import { withUnmount } from "../context/unmount";
import { trackChildren } from ".";
import { gathererKey } from "../context/sinks";

export type Ref = {
  data: {
    instance: null | Sinks;
    unmount: () => void;
    constructorFn: Function | undefined;
  };
  tracker: IndexedTracker<Function, Ref>;
};

export function Ref(constructorFn?: Function): Ref {
  const destroy$ = xs.create();
  const ref = {
    data: {
      constructorFn,
      instance: {},
      unmount: () => {},
    },
    tracker: makeUsageTrackerIndexed<Function, Ref>({
      create(func) {
        return Ref(func);
      },
      use(ref) {
        // TODO props update
        return ref;
      },
      destroy(ref) {
        ref.data.unmount();
        destroy$.shamefullySendNext(null);
      },
    }),
  };

  if (constructorFn) {
    ref.data.instance = withRef(ref, () => {
      const [unmount, result] = withUnmount(() => {
        const result = constructorFn();
        const sinks = result.DOM ? result : { DOM: streamify(result) };

        const transformedSinks = mapObj(
          (sink$: Stream<any>) => sink$.endWhen(destroy$),
          sinks
        );
        delete transformedSinks.DOM;

        safeUseContext(gathererKey)?.(transformedSinks);

        return {
          ...transformedSinks,
          DOM: trackChildren(sinks.DOM).remember(),
        };
      }, "component");
      ref.data.unmount = unmount;

      return result;
    });
  }

  return ref;
}

export const refSymbol: ContextKey<Ref> = Symbol("ref");

export function withRef<T>(ref: Ref, exec: () => T): T {
  return withContext(refSymbol, ref, () => {
    try {
      ref.tracker.open();
      return exec();
    } finally {
      ref.tracker.close();
    }
  });
}

export function useRef(): Ref {
  return useContext(refSymbol);
}
export function safeUseRef(): Ref {
  return safeUseContext(refSymbol);
}
