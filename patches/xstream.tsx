import xs, { Stream, InternalProducer, NO } from "xstream";
import {
  useCurrentZone,
  withZone,
  useContext,
  withContext,
  safeUseContext,
} from "../context";
import { registererKey } from "../sinks";
import { mapObj } from "../helpers";
import { Sinks } from "../types";

Object.defineProperty(Stream.prototype, "_prod", {
  set<T>(producer: InternalProducer<T> | typeof NO) {
    this.__prod = producer;

    /* patch */
    const zone = useCurrentZone();
    if (!zone.parent) {
      return;
    }

    let next = this._n.bind(this);
    let localSinks: Sinks = {};
    this._n = function (v: T) {
      withZone(zone, () => {
        const gatherer = safeUseContext(registererKey);
        if (!gatherer) {
          next(v);
          return;
        }

        Object.values(localSinks).forEach((x) => x._c());
        localSinks = {};
        withContext(
          registererKey,
          (sinks: Sinks) => {
            localSinks = sinks;
            gatherer(sinks);
          },
          () => next(v)
        );
      });
    };
    /* /patch */
  },
  get<T>() {
    return this.__prod as InternalProducer<T>;
  },
});
