import xs, { Stream } from "xstream";
import { IndexedTracker, makeUsageTrackerIndexed } from "./trackUsageIndexed";
import { ContextKey, withContext, useContext, safeUseContext } from "..";
import { useSources } from "../context/sources";
import { mapObj, isObservable } from "../helpers";
import { Sinks } from "../types";
import { withUnmount } from "../context/unmount";
import { trackChildren } from ".";

export type Ref = {
  data: {
    instance: null | Sinks;
    unmount: () => void;
    constructorFn: Function | undefined;
  };
  tracker: IndexedTracker<Function, Ref>;
};

export function Ref(constructorFn?: Function): Ref {
  // console.log(constructorFn);

  const destroy$ = xs.create();
  const ref = {
    data: {
      constructorFn,
      instance: {},
      unmount: () => {},
    },
    tracker: makeUsageTrackerIndexed<Function, Ref>({
      create(func) {
        // console.log(func, "create");
        return Ref(func);
      },
      use(ref) {
        // console.log(ref.data.constructorFn, "use");
        // TODO update
        return ref;
      },
      destroy(ref) {
        // console.log(ref.data.constructorFn, "destroy");
        ref.tracker.destroy();
        ref.data.unmount();
        destroy$.shamefullySendNext(null);
      },
    }),
  };

  if (constructorFn) {
    ref.data.instance = withRef(ref, () => {
      const [unmount, result] = withUnmount(() => constructorFn(), "component");
      ref.data.unmount = unmount;
      // prettier-ignore
      const sinks = result.DOM ? result : {DOM: result}

      return {
        ...mapObj((sink$: Stream<any>) => sink$.endWhen(destroy$), sinks),
        DOM: trackChildren(sinks.DOM),
      };
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
