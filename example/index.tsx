import xs from "xstream";
import { run } from "@cycle/run";
import { makeDOMDriver, button } from "@cycle/dom";
import modules from "@cycle/dom/lib/es6/modules";
import { withHooks } from "../lib/wrapper";
import { makeEffectsDriver } from "../lib/driver";
import { useState } from "../lib/hooks/useState";
import { createElement as h } from "../lib/pragma";
import { eventListenersModule } from "snabbdom/build/package/modules/eventlisteners";
import { useEffect } from "../lib/hooks/useEffect";
import { autorun } from "../lib/autorun";

function App() {
  const [visible$, setVisible] = useState(false);
  return autorun((v) => (
    <div>
      <h1>Examples</h1>
      <button
        on={{
          click: () => setVisible((x) => !x),
        }}
      >
        Afficher ?
      </button>
      {v(visible$) ? <Incrementer /> : null}
    </div>
  ));
}

function Incrementer() {
  const [count$, setCount] = useState(0);
  const [isDown$, setIsDown] = useState(false);
  const increment$ = isDown$
    .map((down) => (down ? xs.periodic(50).startWith(null) : xs.empty()))
    .flatten()
    .mapTo((x: number) => x + 1);

  useEffect(
    increment$.map((fn) => {
      return () => setCount(fn);
    })
  );
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
