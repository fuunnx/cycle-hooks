import { Stream, InternalProducer, NO } from "xstream";
import { provideSources, safeUseSources } from "../sources";
import { map } from "rambda";
import { safeUseRegisterer, withSinksRegisterer } from "../sinks";

Object.defineProperty(Stream.prototype, "_prod", {
  set<T>(producer_: InternalProducer<T> | typeof NO) {
    if (producer_ === NO) {
      this.__prod = NO;
      return;
    }
    const producer = producer_ as InternalProducer<T>;
    const sources = safeUseSources();
    if (!sources) {
      this.__prod = producer;
      return;
    }
    const prod: InternalProducer<T> = {
      _start(listener) {
        if (!sources) {
          producer._start(listener);
          return;
        }
        producer._start({
          _n(v: T) {
            provideSources(sources, () => {
              listener._n(v);
            });
          },
          _e(e: any) {
            listener._e(e);
          },
          _c() {
            listener._c();
          },
        });
      },
      _stop() {
        producer._stop();
      },
    };
    this.__prod = prod;
  },
  get<T>() {
    return this.__prod as InternalProducer<T>;
  },
});
