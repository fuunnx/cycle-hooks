import { provideSources, useSources, safeUseSources } from "./sources";
import xs, { Stream } from "xstream";
import { mockTimeSource } from "@cycle/time";

test("provides sources 1 level deep", () => {
  const sources = { a: xs.empty() };
  const App = () => {
    let innerSources = useSources();
    expect(innerSources).toEqual(sources);
    return {};
  };
  provideSources(sources, () => App());
});

test("cleans up after execution", () => {
  const sources = { a: xs.empty() };
  provideSources(sources, () => {});
  expect(() => useSources()).toThrow();
});

test("provides sources 2 levels deep", () => {
  const sources1 = { a: xs.empty() };
  const sources2 = { b: xs.empty() };
  const App = () => {
    provideSources(sources2, () => {
      return Component();
    });
  };
  const Component = () => {
    let innerSources = useSources();
    expect(innerSources).toEqual(sources2);
    return {};
  };

  provideSources(sources1, () => App());
});

test("provides sources over temporality (simple)", (done) => {
  const sources = { a: xs.empty() };
  const App = () => {
    return {
      a: xs
        .periodic(10)
        .take(1)
        .map(() => useSources()),
    };
  };
  const sinks = provideSources(sources, () => App());

  sinks.a.subscribe({
    next(innerSources) {
      expect(innerSources).toEqual(sources);
    },
    error(e) {
      throw e;
    },
    complete() {
      done();
    },
  });
});

function testMethod(methodName: string, getStream: () => Stream<any>) {
  test(`provides sources over temporality (${methodName})`, (done) => {
    const sources = { a: xs.empty() };
    const App = () => {
      return {
        a: getStream().map(() => safeUseSources()),
      };
    };
    const sinks = provideSources(sources, () => App());

    var sub = sinks.a.subscribe({
      next(innerSources) {
        expect(innerSources).toEqual(sources);
        setTimeout(() => sub?.unsubscribe());
        done();
      },
      error(e) {
        throw e;
      },
      complete() {
        done();
      },
    });
    setTimeout(() => {
      sub?.unsubscribe();
      throw "Too long";
    }, 1000);
  });
}

type ToTest = { [P in keyof Stream<any> | string]?: () => Stream<any> };
const methodsTests: ToTest = {
  create: () =>
    xs.create({
      start(l) {
        setTimeout(() => l.next(""));
      },
      stop() {},
    }),

  createWithMemory: () =>
    xs.createWithMemory({
      start(l) {
        setTimeout(() => l.next(""));
      },
      stop() {},
    }),

  throw: () => xs.throw("error").replaceError(() => testStream()),
  from: () => xs.from(testStream()),
  of: () => xs.of(""),
  fromArray: () => xs.fromArray(["a", "b"]),
  fromPromise: () => xs.fromPromise(Promise.resolve("")),
  fromObservable: () => xs.fromObservable(xs.of("")),
  periodic: () => xs.periodic(10).take(1),
  merge: () => xs.merge(testStream(), testStream()),
  combine: () => xs.combine(testStream(), testStream()),
  compose: () => testStream().compose(() => testStream()),
  "create + push": () => {
    const stream = xs.create();
    setTimeout(() => {
      stream.shamefullySendNext("");
    });
    return stream;
  },
  "Time.diagram": () => {
    const Time = mockTimeSource();
    setImmediate(() => {
      Time.run();
    });
    return Time.diagram("--x--");
  },
};

function testStream() {
  return xs.fromPromise(Promise.resolve(null));
}

Object.entries(methodsTests).forEach(([name, value]) => {
  testMethod(name, value);
});
