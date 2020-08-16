import xs, { Stream } from "xstream";
import { IndexedTracker, makeUsageTrackerIndexed } from "./trackUsageIndexed";
import { ContextKey, withContext, useContext } from "..";
import { useSources } from "../context/sources";
import { mapObj, isObservable } from "../helpers";
import { Sinks } from "../types";

export type Ref = {
  data: { instance: null | Sinks };
  tracker: IndexedTracker<Function, Ref>;
};

export function Ref(constructorFn?: Function): Ref {
  const destroy$ = xs.create();
  const ref = {
    data: {
      instance: {},
    },
    tracker: makeUsageTrackerIndexed<Function, Ref>({
      create(func) {
        return Ref(func);
      },
      use(ref) {
        // TODO update
        return ref;
      },
      destroy(ref) {
        ref.tracker.destroy();
        destroy$.shamefullySendNext(null);
      },
    }),
  };

  if (constructorFn) {
    ref.data.instance = withRef(ref, () => {
      const result = constructorFn(useSources());
      // prettier-ignore
      const sinks = isObservable(result) ? { DOM: result } 
        : (isObservable(result) as any).DOM ? result
        : { DOM: xs.of(result) };

      return mapObj((sink$: Stream<any>) => sink$.endWhen(destroy$), sinks);
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
