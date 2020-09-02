import { Stream, InternalProducer, NO } from "xstream";
import { useCurrentZone, withZone, safeUseContext } from "../context";
import { gathererKey } from "../context/sinks";
import { Sinks } from "../types";
import { withUnmount } from "../context/unmount";

// this is a way to hook into the Stream constructor call
Object.defineProperty(Stream.prototype, "_prod", {
  set<T>(producer: InternalProducer<T> | typeof NO) {
    this.__prod = producer;
    patch(this);
  },
  get<T>() {
    return this.__prod as InternalProducer<T>;
  },
});

function patch(stream: Stream<any>): void {
  let zone = useCurrentZone();
  if (!zone.parent) {
    return;
  }

  let unmount = () => {};
  const gatherer = safeUseContext(gathererKey);
  if (gatherer) {
    zone = zone.fork([
      [
        gathererKey,
        (sinks: Sinks) => {
          gatherer(sinks);
        },
      ],
    ]);
  }

  let _n = stream._n.bind(stream);
  let _c = stream._c.bind(stream);
  let _e = stream._e.bind(stream);

  Object.assign(stream, {
    _e(e) {
      unmount();
      withZone(zone, () => {
        [unmount] = withUnmount(() => _e(e));
      });
    },
    _c() {
      unmount();
      withZone(zone, () => {
        [unmount] = withUnmount(() => _c());
      });
    },
    _n(v: any) {
      unmount();
      withZone(zone, () => {
        [unmount] = withUnmount(() => _n(v));
      });
    },
  });
}
