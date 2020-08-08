import { Stream, InternalProducer, NO } from "xstream";
import { useCurrentZone, withZone, safeUseContext, forkZone } from "../context";
import { gathererKey } from "../context/sinks";
import { Sinks } from "../types";

// it's just a way to hook into the Stream constructor call
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

  let localSinks: Sinks = {};
  const gatherer = safeUseContext(gathererKey);
  if (gatherer) {
    zone = forkZone(zone, [
      [
        gathererKey,
        (sinks: Sinks) => {
          localSinks = sinks;
          gatherer(sinks);
        },
      ],
    ]);
  }

  let _n = stream._n.bind(stream);
  let _c = stream._c.bind(stream);
  let _e = stream._e.bind(stream);

  Object.assign(stream, {
    _e() {
      Object.values(localSinks).forEach((x) => x._c());
      localSinks = {};
      withZone(zone, () => _e());
    },
    _c() {
      Object.values(localSinks).forEach((x) => x._c());
      localSinks = {};
      withZone(zone, () => _c());
    },
    _n(v: any) {
      Object.values(localSinks).forEach((x) => x._c());
      localSinks = {};
      withZone(zone, () => _n(v));
    },
  });
}
