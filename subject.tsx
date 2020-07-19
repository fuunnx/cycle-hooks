import xs from "xstream";
import { Stream, Listener } from "xstream";

export type Subject<T> = {
  stream$: Stream<T>;
  listener: Listener<T>;
};

export function Subject<T>(): Subject<T> {
  let buffer = [];

  let subject = {
    stream$: xs.create<T>({
      start(listener) {
        subject.listener = listener;
        for (let { type, value } of buffer) {
          subject.listener[type](value);
          if (type === "complete") break;
        }
        buffer = [];
      },
      stop() {},
    }),

    listener: {
      next(value) {
        buffer.push({ type: "next", value });
      },
      error(value) {
        buffer.push({ type: "error", value });
      },
      complete() {
        // buffer.push({ type: "complete" });
      },
    },
  };

  return subject;
}
