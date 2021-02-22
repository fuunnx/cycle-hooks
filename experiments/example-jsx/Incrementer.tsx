import xs, { Stream } from 'xstream'
import { useState } from './hooks/state'
import { createElement } from '../jsx'

type Props = {
  value$: Stream<number>
}

export const Incrementer = function Incrementer(_: Props) {
  const props$ = useProps$<Props>()

  const [isDown$, setIsDown] = useState(false)

  const increment$ = isDown$
    .map((down) => (down ? xs.periodic(50).startWith(null) : xs.empty()))
    .flatten()
    .mapTo((x: number) => x + 1)

  const [count$, setCount] = useState(
    xs.merge(
      props$
        .map((x) => x.value$)
        .flatten()
        .map((value) => () => value),
      increment$,
    ),
    0,
  )

  return count$.map((count) => (
    <div>
      <button
        onMouseDown={() => setIsDown(true)}
        onMouseUp={() => setIsDown(false)}
        onMouseLeave={() => setIsDown(false)}
      >
        {count}
      </button>
      <button type="button" onClick={() => setCount(0)}>
        Reset
      </button>
    </div>
  ))
}
