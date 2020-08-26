import xs from "xstream";
import { useState } from "../lib/hooks/useState";
import { useEffect } from "../lib/hooks/useEffect";
import { onUnmount } from "../lib/context/unmount";
import { createElement } from "../lib/pragma";
import { define } from "../lib/pragma/define";

type Props = {
  value: number;
};

export const Incrementer = define<Props>(function Incrementer(props$) {
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
