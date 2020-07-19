import { Stream, InternalProducer, NO } from "xstream";
import { useCurrentZone, withZone } from "../context";

const zones = new WeakMap();

Object.defineProperty(Stream.prototype, "_prod", {
  set<T>(producer_: InternalProducer<T> | typeof NO) {
    const zone = useCurrentZone();
    if (!zone.parent) {
      this.__prod = producer_;
      return;
    }
    this._zone = zone;

    if (producer_ === NO) {
      this.__prod = NO;
      let next = this._n.bind(this);
      this._n = function (v: T) {
        withZone(zone, () => {
          next(v);
        });
      };
      return;
    }
    const producer = producer_ as InternalProducer<T>;

    const prod: InternalProducer<T> = {
      _start(listener) {
        producer._start({
          _n(v: T) {
            withZone(zone, () => {
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

// (Stream.prototype as any).__n = Stream.prototype._n;
// Object.defineProperty(Stream.prototype, "_n", {
//   set(v) {
//     this.__n = v;
//   },
//   get() {
//     if (!this._zone) {
//       console.log("skip");
//       return this.__n;
//     }
//     console.log("don't skip");
//     return function (v: any) {
//       return withZone(this._zone, () => {
//         return this.__n(v);
//       });
//     }.bind(this);
//   },
// });
