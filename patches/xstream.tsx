import { Stream, InternalProducer, NO } from "xstream";
import { useCurrentZone, withZone } from "../context";

const zones = new WeakMap();

Object.defineProperty(Stream.prototype, "_prod", {
  set<T>(producer: InternalProducer<T> | typeof NO) {
    this.__prod = producer;

    /* patch */
    const zone = useCurrentZone();
    if (!zone.parent) {
      return;
    }

    let next = this._n.bind(this);
    this._n = function (v: T) {
      withZone(zone, () => {
        next(v);
      });
    };
    /* /patch */
  },
  get<T>() {
    return this.__prod as InternalProducer<T>;
  },
});
