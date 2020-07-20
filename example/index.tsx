import xs from "xstream";
import { run } from "@cycle/core";
import { makeDOMDriver } from "@cycle/dom";
import { withHooks } from "../withHooks";
// import { withHooks, makeEffectsDriver } from "..";
// import { useState } from "../useState";
import { createElement as h } from "../pragma";

function App() {
  const count$ = xs.of(1);
  // const [count$, setCount] = useState(0);
  return {
    DOM: count$.map((count) => (
      <button onClick={() => setCount((val) => val + 1)}>{count}</button>
    )),
  };
}

const drivers = {
  /*effects: makeEffectsDriver(),*/ DOM: makeDOMDriver("#app"),
};
run(App, drivers);
// run(withHooks(App, Object.keys(drivers)), drivers);

function setCount(x: any) {}
