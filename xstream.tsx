import xs, {
  Stream,
  Subscription,
  MemoryStream,
  Producer,
  Observable,
  MergeSignature,
  CombineSignature,
} from "xstream";
import { useSources, provideSources, safeUseSources } from "./sources";
import { registerSinks, gatherSinks } from "./sinks";
import { map } from "rambda";

export default class HooksStream<T> extends Stream<T> {
  // sources: any;
  // constructor(producer: InternalProducer<T>) {
  //   const sources = useSources();
  //   let listen: Listener<null> = null;
  //   const next$ = xs.create({
  //     start(l) {
  //       listen = l;
  //     },
  //     stop() {},
  //   });
  //   console.log("heeye ?");
  //   super({
  //     _start(listener) {
  //       listener._n;
  //       producer._start({
  //         _n(x) {
  //           console.log("next");
  //           listen.next(null);
  //           const [sinks] = gatherSinks(() =>
  //             provideSources(sources, () => {
  //               console.log("heeeys");
  //               listener._n(x);
  //             })
  //           );
  //           registerSinks(map((sink$) => sink$.endWhen(next$), sinks));
  //         },
  //         _e(e) {
  //           listener._e(e);
  //           listen.error(e);
  //         },
  //         _c() {
  //           listener._c();
  //           listen.complete();
  //         },
  //       });
  //     },
  //     _stop() {},
  //   });

  //   this.sources = sources;
  // }

  static create<T>(producer?: Producer<T>): Stream<T> {
    return wrap(xs.create(producer));
  }

  static createWithMemory<T>(producer?: Producer<T>): MemoryStream<T> {
    return wrapMemory(xs.createWithMemory(producer));
  }

  static throw(error: any): Stream<any> {
    return wrap(xs.throw(error));
  }

  static from<T>(
    input: PromiseLike<T> | Stream<T> | Array<T> | Observable<T>
  ): Stream<T> {
    return wrap(xs.from(input));
  }
  static of<T>(...items: Array<T>): Stream<T> {
    return wrap(xs.of(...items));
  }
  static fromArray<T>(array: Array<T>): Stream<T> {
    return wrap(xs.fromArray(array));
  }
  static fromPromise<T>(promise: PromiseLike<T>): Stream<T> {
    return wrap(xs.fromPromise(promise));
  }
  static fromObservable<T>(obs: { subscribe: any }): Stream<T> {
    return wrap(xs.fromObservable(obs));
  }
  static periodic(period: number): Stream<number> {
    return wrap(xs.periodic(period));
  }
  static merge: MergeSignature = function merge(
    ...streams: Array<Stream<any>>
  ) {
    return wrap(xs.merge(...streams));
  };
  static combine: CombineSignature = function combine(
    ...streams: Array<Stream<any>>
  ) {
    return wrapMemory(xs.combine(...streams));
  } as CombineSignature;
}

function _wrap<T>(
  stream$: Stream<T> | MemoryStream<T>,
  isMemoryStream = false,
  sources = safeUseSources()
) {
  let sub: Subscription;

  const method = isMemoryStream ? "createWithMemory" : "create";
  const res$ = (xs[method] as any)({
    start(listener) {
      sub = stream$.subscribe({
        error(e) {
          provideSources(sources, () => {
            listener.error(e);
          });
        },
        complete() {
          listener.complete();
        },
        next(val) {
          provideSources(sources, () => {
            listener.next(val);
          });
        },
      });
    },
    stop() {
      sub?.unsubscribe();
    },
  });

  return new Proxy(res$, {
    get(res$, key) {
      const delegate = Reflect.get(res$, key).bind(res$);
      if (typeof delegate !== "function") {
        return delegate;
      }
      if (["subscribe"].includes(key as any)) {
        return delegate;
      }
      return function () {
        return wrap(delegate(...arguments));
      };
    },
  });
}

function wrap<T>(stream: Stream<T>) {
  return _wrap(stream) as Stream<T>;
}

function wrapMemory<T>(stream: MemoryStream<T>) {
  return _wrap(stream, true) as MemoryStream<T>;
}
