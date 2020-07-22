import xs from "xstream";
import { run } from "@cycle/run";
import { makeDOMDriver, button } from "@cycle/dom";
import modules from "@cycle/dom/lib/es6/modules";
import { withHooks } from "../withHooks";
import { makeEffectsDriver, makeSubject } from "..";
import { useState } from "../useState";
import { createElement as h } from "../pragma";
import { eventListenersModule } from "snabbdom/build/package/modules/eventlisteners";
import { useEffect } from "../effectsDriver";

function App() {
  return (
    <div>
      <h1>Examples</h1>
      <Incrementer />
    </div>
  );
}

function Incrementer() {
  const [count$, setCount] = useState(0);
  const [isDown$, setIsDown] = useState(false);
  const increment$ = isDown$
    .map((down) => (down ? xs.periodic(500).startWith(null) : xs.empty()))
    .flatten()
    .mapTo((x: number) => x + 1);

  useEffect(increment$.map((fn) => () => setCount(fn)));
  return (
    <div>
      <button
        on={{
          mousedown: () => setIsDown(true),
          mouseup: () => setIsDown(false),
          mouseleave: () => setIsDown(false),
        }}
      >
        {count$}
      </button>
      <button type="button" on={{ click: () => setCount(0) }}>
        Reset
      </button>
    </div>
  );
}

const drivers = {
  effects: makeEffectsDriver(),
  DOM: makeDOMDriver("#app", {
    modules: [...modules, eventListenersModule],
  }),
};

run(withHooks(App, Object.keys(drivers)), drivers);
