import { Stream } from "./types";
import { useSources } from "./sources";
import xs, { Listener, MemoryStream } from "xstream";
import { registerSinks } from "./sinks";

type Effect = [Symbol, unknown];

let listener: Listener<Effect> | null = null;
const effect$ = xs.create<Effect>({
  start(l) {
    listener = l;
  },
  stop() {
    listener = null;
  },
});
function triggerEffect(symbol: Symbol, value: unknown) {
  listener?.next([symbol, value]);
}

type EffectsSources = Stream<Effect>;

export function makeSubject<T>(): [Stream<T>, (value: T) => void] {
  const symbol = Symbol();
  const { effects } = useSources() as { effects: EffectsSources };
  if (!effects) {
    throw new Error("Please add an Effects Driver");
  }
  const stream$ = effects.filter((x) => x[0] === symbol).map((x) => x[1] as T);

  return [
    stream$,
    function next(value: T) {
      triggerEffect(symbol, value);
    },
  ];
}

export function makeMemorySubject<T>(
  initial: T
): [MemoryStream<T>, (value: T) => void] {
  const [stream$, next] = makeSubject<T>();

  return [stream$.startWith(initial), next];
}

export function makeEffectsDriver(bus$ = effect$) {
  return function effectsDriver(sink$: Stream<() => void>) {
    sink$.subscribe({
      next: (x) => x(),
    });

    return bus$;
  };
}

export function useEffect(effect$: Stream<() => void>) {
  return registerSinks({
    effects: effect$,
  });
}
