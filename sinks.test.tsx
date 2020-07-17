import xs from "./xstream";
import { sinksGatherer, registerSinks } from "./sinks";
import { mockTimeSource, MockTimeSource } from "@cycle/time";
import { Sinks } from "./types";
import { mergeSinks } from "cyclejs-utils";

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
  const sinks = { a: Time.diagram("-x"), b: Time.diagram("-x") };
  function App() {
    registerSinks(sinks);
    return {};
  }
  const [gathered] = gatherSinks(() => App());
  assertSinksEqual(Time, gathered, sinks);

  Time.run(done);
});

test("gather sinks 2 levels deep", (done) => {
  const gatherSinks = sinksGatherer(["a", "b"]);
  const Time = mockTimeSource();
  const sinksA = { a: Time.diagram("-x"), b: Time.diagram("-x") };
  const sinksB = { a: Time.diagram("--x-x"), b: Time.diagram("-x") };
  function App() {
    registerSinks(sinksA);
    Component();
    return {};
  }
  function Component() {
    registerSinks(sinksB);
    return {};
  }

  const [gathered] = gatherSinks(() => App());
  assertSinksEqual(Time, gathered, mergeSinks([sinksA, sinksB]));

  Time.run(done);
});

test("gather sinks inside streams", (done) => {
  const gatherSinks = sinksGatherer(["a", "b"]);
  const Time = mockTimeSource();
  const sinks = { a: Time.diagram("-a"), b: Time.diagram("-b") };
  const c$ = Time.diagram("-x")
    .map(() => Component())
    .map((x) => x.d)
    .flatten();
  function App() {
    return {
      c: c$,
    };
  }
  function Component() {
    registerSinks(sinks);
    return { d: xs.of("y") };
  }

  const [gathered, appSinks] = gatherSinks(() => App());
  appSinks.c.subscribe({});
  assertSinksEqual(Time, mergeSinks([appSinks, gathered]), { ...sinks, c: c$ });

  Time.run(done);
});
