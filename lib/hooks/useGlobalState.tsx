import xs from "xstream";
import { makeSubject } from "../driver";
import { registerSinks } from "../context/sinks";
import { useSources } from "../context/sources";

export type Reducer<T> = (x: T) => T;

export function useGlobalState<T>(initial: T) {
  const [reducer$, runReducer] = makeSubject<Reducer<T>>("useGlobalState");
  const state$ = useSources().state.stream;

  registerSinks({
    state: reducer$.startWith((state) => {
      return state === undefined ? initial : state;
    }),
  });

  return [
    state$,
    function setState(val: Reducer<T> | T | Partial<T>) {
      if (typeof val === "function") {
        return runReducer(val as Reducer<T>);
      }
      if (val && typeof val === "object" && !Array.isArray(val)) {
        return runReducer((old) => ({
          ...old,
          ...val,
        }));
      }
      return runReducer(() => val as T);
    },
  ] as const;
}
