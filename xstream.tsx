import xs, { Stream, InternalProducer, Listener } from "xstream";
import { useSources, provideSources } from "./sources";
import { registerSinks, gatherSinks } from "./sinks";
import { map } from "rambda";

export default class HooksStream<T> extends Stream<T> {
  constructor(producer: InternalProducer<T>) {
    const sources = useSources();
    let listen: Listener<null> = null;
    const next$ = xs.create({
      start(l) {
        listen = l;
      },
      stop() {},
    });
    super({
      _start(listener) {
        listener._n;
        producer._start({
          _n(x) {
            listen.next(null);
            const [sinks] = gatherSinks(() =>
              provideSources(sources, () => {
                listener._n(x);
              })
            );
            registerSinks(map((sink$) => sink$.endWhen(next$), sinks));
          },
          _e(e) {
            listener._e(e);
            listen.error(e);
          },
          _c() {
            listener._c();
            listen.complete();
          },
        });
      },
      _stop() {},
    });
  }
}
