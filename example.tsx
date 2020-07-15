import { run } from "@cycle/core";
import { withHooks, makeEffectsDriver } from ".";
import { useState } from "./useState";

function App() {
  const [count$, setCount] = useState(0);
  return {
    DOM: count$.map((count) => (
      <button onClick={() => setCount((val) => val + 1)}>{count}</button>
    )),
  };
}

run(withHooks(App), { effects: makeEffectsDriver() });
