import { IndexedTracker, makeUsageTrackerIndexed } from "./trackUsageIndexed";
import { ContextKey, withContext, useContext } from "..";

export type Ref = {
  data: any;
  tracker: IndexedTracker<Function, Ref>;
};

export function Ref(constructorFn: Function = () => ({})): Ref {
  return {
    data: constructorFn(),
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
      },
    }),
  };
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
