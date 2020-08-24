import xs, { MemoryStream } from "xstream";
import { run } from "@cycle/run";
import { makeDOMDriver, code } from "@cycle/dom";
import modules from "@cycle/dom/lib/es6/modules";
import { withHooks } from "../lib/wrapper";
import { makeEffectsDriver } from "../lib/driver";
import { useState } from "../lib/hooks/useState";
import { createElement } from "../lib/pragma";
import { eventListenersModule } from "snabbdom/build/package/modules/eventlisteners";
import { useEffect } from "../lib/hooks/useEffect";
import { withState } from "@cycle/state";
import { useGlobalState } from "../lib/hooks/useGlobalState";
import { onUnmount } from "../lib/context/unmount";
import { useSources } from "../lib";
import { define } from "../lib/pragma/define";

function App() {
  const [visible$, setVisible] = useState(true);
  const state$ = useSources().state.stream;

  onUnmount(() => console.log("goodbye App"));

  return (
    <div>
      <h1>Examples</h1>
      <code>
        {state$.startWith(undefined).map((x) => JSON.stringify(x, null, "  "))}
      </code>
      <br />
      <button
        on={{
          click: () => setVisible((x) => !x),
        }}
      >
        Afficher ?
      </button>
      {visible$.map((visible) =>
        visible
          ? [<Incrementer value={xs.periodic(1000).debug("next")} />, <Input />]
          : null
      )}
    </div>
  );
}

const Incrementer = define<{ value: number }>(function Incrementer(
  props$: MemoryStream<{ value: number }>
) {
  const [count$, setCount] = useState(0);
  const [isDown$, setIsDown] = useState(false);
  const increment$ = isDown$
    .map((down) => (down ? xs.periodic(50).startWith(null) : xs.empty()))
    .flatten()
    .mapTo((x: number) => x + 1);

  useEffect(
    props$.map((props) => {
      return () => setCount(props.value);
    })
  );
  useEffect(
    increment$.map((fn) => {
      return () => setCount(fn);
    })
  );

  console.log("run Incrementer");
  useEffect(xs.of(() => console.log("hello Incrementer")));
  onUnmount(() => console.log("goodbye Incrementer"));

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
});

const Input = define(function Input() {
  const [state$, setState] = useGlobalState({});

  console.log("run Input");
  useEffect(xs.of(() => console.log("hello Input")));
  onUnmount(() => console.log("goodbye Input"));

  return (
    <input
      type="text"
      value={state$.map((x) => x.value).startWith("")}
      on={{
        input(e) {
          setState({ value: e.target.value });
        },
      }}
    />
  ).debug("INPUT");
});

const drivers = {
  effects: makeEffectsDriver(),
  DOM: makeDOMDriver("#app", {
    modules: [...modules, eventListenersModule],
  }),
};

run(withState(withHooks(App, [...Object.keys(drivers), "state"])), drivers);
