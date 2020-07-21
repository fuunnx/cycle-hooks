import { makeSubject } from "./effectsDriver";

type Reducer<T> = (x: T) => T;

export function useState<T>(initial: T) {
  const [reducer$, runReducer] = makeSubject<Reducer<T>>();
  const state$ = reducer$.fold((acc, red) => red(acc), initial);

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
