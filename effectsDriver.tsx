import { Stream } from "./types";
import { useSources } from "./sources";
import xs, { Listener, MemoryStream } from "xstream";

type Effect = [Symbol, unknown];

let listener: Listener<Effect> | null = null;
const effect$ = xs.create<Effect>({
  start(l) {
    listener = l;
  },
  stop() {},
});
function triggerEffect(symbol: Symbol, value: unknown) {
  listener.next([symbol, value]);
}

export function makeSubject<T>(): [Stream<T>, (value: T) => void] {
  const symbol = Symbol();
  const stream$ = useSources<{ effects: Stream<Effect> }>()
    .effects.filter((x) => x[0] === symbol)
    .map((x) => x[1] as T);

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
