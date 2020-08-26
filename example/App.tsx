import xs from "xstream";
import { useState } from "../lib/hooks/useState";
import { useSources, createElement } from "../lib";
import { Input } from "./Input";
import { Incrementer } from "./Incrementer";
import { Timer } from "./Timer";
import { define } from "../lib/pragma/define";

export function App() {
  const state$ = useSources().state.stream;

  return (
    <div>
      <h1>Examples</h1>
      <Togglable title="Serialized global state">
        <code>
          {state$
            .startWith(undefined)
            .map((x) => JSON.stringify(x, null, "  "))}
        </code>
      </Togglable>
      <code>
        {/* {state$.startWith(undefined).map((x) => JSON.stringify(x, null, "  "))} */}
      </code>
      <Togglable title="Incrementer">
        <Incrementer value={xs.periodic(1000)} />
      </Togglable>
      <Togglable title="Input">
        <Input />
      </Togglable>
      <Togglable title="Timer">
        <Timer />
      </Togglable>
    </div>
  );
}

type Props = {
  title: string;
};
const Togglable = define<Props>(function Togglable(props$) {
  const [visible$, setVisible] = useState(true);

  return (
    <section>
      <header
        tabIndex={0}
        on={{
          click: () => setVisible((x) => !x),
        }}
      >
        <h2>{props$.map((x) => x.title)}</h2>
      </header>
      {visible$.map(
        (visible) =>
          visible && <content>{props$.map((x) => x.children)}</content>
      )}
    </section>
  );
});
