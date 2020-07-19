import xs from "xstream";
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
