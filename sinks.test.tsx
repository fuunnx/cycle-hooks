import xs from "xstream";
import { sinksGatherer, registerSinks } from "./sinks";
import { mockTimeSource, MockTimeSource } from "@cycle/time";
import { Sinks } from "./types";
import { mergeSinks } from "./helpers";

function assertSinksEqual(
  Time: MockTimeSource,
  actual: Sinks,
  expected: Sinks
) {
  expect(Object.keys(expected).sort()).toEqual(Object.keys(actual).sort());
  Object.entries(expected).forEach(([key, value$]) => {
    Time.assertEqual(actual[key], value$);
  });
}

test("gather sinks 1 level deep", (done) => {
  const gatherSinks = sinksGatherer(["a", "b"]);
  const Time = mockTimeSource();
  const makeSinks = () => ({ a: Time.diagram("-x"), b: Time.diagram("-x") });
  function App() {
    registerSinks(makeSinks());
    return {};
  }
  const [gathered] = gatherSinks(() => App());
  assertSinksEqual(Time, gathered, makeSinks());

  Time.run(done);
});

test("gather sinks 2 levels deep", (done) => {
  const gatherSinks = sinksGatherer(["a", "b"]);
  const Time = mockTimeSource();
  const sinksA = () => ({ a: Time.diagram("-x"), b: Time.diagram("-x") });
  const sinksB = () => ({ a: Time.diagram("--x-x"), b: Time.diagram("-x") });
  function App() {
    registerSinks(sinksA());
    Component();
    return {};
  }
  function Component() {
    registerSinks(sinksB());
    return {};
  }

  const [gathered] = gatherSinks(() => App());
  assertSinksEqual(Time, gathered, mergeSinks([sinksA(), sinksB()]));

  Time.run(done);
});

test("gather sinks inside streams", (done) => {
  const gatherSinks = sinksGatherer(["d"]);
  const Time = mockTimeSource();
  const sinks = () => ({ d: Time.diagram("dddd") });
  const c$ = () => Time.diagram("--x--");
  function App() {
    return {
      c: c$().map(() => {
        registerSinks(sinks());
        return "y";
      }),
    };
  }

  const [gathered, appSinks] = gatherSinks(() => App());
  assertSinksEqual(Time, mergeSinks([appSinks, gathered]), {
    ...sinks(),
    c: c$().mapTo("y"),
  });

  Time.run(done);
});

test("stop gathered sinks on next", (done) => {
  const gatherSinks = sinksGatherer(["b"]);
  const Time = mockTimeSource();

  const events = () => Time.diagram("---a-----b-----c");
  const repeatEvent = (char: string) => {
    return Time.diagram("-" + String(char).repeat(10));
  };
  function App() {
    return {
      a: events().map((char) => {
        registerSinks({
          b: repeatEvent(char),
        });
        return char;
      }),
    };
  }

  const [gathered, appSinks] = gatherSinks(() => App());
  assertSinksEqual(Time, gathered, {
    b: events().map(repeatEvent).flatten(),
  });
  assertSinksEqual(Time, appSinks, {
    a: events(),
  });

  Time.run(done);
});

test("stop gathered sinks on next (2)", (done) => {
  const gatherSinks = sinksGatherer(["b"]);

  const events = () => xs.periodic(100).take(10);
  const repeatEvent = (char: string | number) => {
    return xs.periodic(20).mapTo(char).take(20);
  };
  function App() {
    return {
      a: events().map((char) => {
        registerSinks({
          b: repeatEvent(char),
        });
        return char;
      }),
    };
  }

  const [gathered, appSinks] = gatherSinks(() => App());

  const actual = [];
  const expected = [];
  let completed = 0;
  gathered.b.take(10).addListener({
    next(val) {
      actual.push(val);
    },
    complete() {
      completed += 1;
      if (completed >= 2) {
        expect(actual).toEqual(expected);
        done();
      }
    },
  });
  events()
    .map(repeatEvent)
    .flatten()
    .take(10)
    .addListener({
      next(val) {
        expected.push(val);
      },
      complete() {
        completed += 1;
        if (completed >= 2) {
          expect(actual).toEqual(expected);
          done();
        }
      },
    });

  appSinks.a.addListener({});
});

test("gather sinks inside streams, multiple times", (done) => {
  const gatherSinks = sinksGatherer(["d"]);
  const Time = mockTimeSource();
  const sinksA = () => Time.diagram("-d-d");
  const sinksB = () => Time.diagram("--e-e");
  const c$ = () => Time.diagram("--x--");
  function App() {
    return {
      c: c$().map(() => {
        registerSinks({ d: sinksA() });
        registerSinks({ d: sinksB() });
        return "y";
      }),
    };
  }

  const [gathered, appSinks] = gatherSinks(() => App());
  assertSinksEqual(Time, mergeSinks([appSinks, gathered]), {
    d: xs.merge(sinksA(), sinksB()),
    c: c$().mapTo("y"),
  });

  Time.run(done);
});
