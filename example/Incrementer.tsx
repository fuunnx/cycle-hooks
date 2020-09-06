import xs from 'xstream'
import { useState } from '../lib/hooks/useState'
import { useEffect } from '../lib/hooks/useEffect'
import { createElement } from '../lib/pragma'
import { define } from '../lib/pragma/define'
import { unwrapVtree$ } from '../lib/helpers/unwrapVtree$'

type Props = {
  value: number
}

export const Incrementer = define<Props>(function Incrementer({ props$ }) {
  const [count$, setCount] = useState(0)
  const [isDown$, setIsDown] = useState(false)
  const increment$ = isDown$
    .map((down) => (down ? xs.periodic(50).startWith(null) : xs.empty()))
    .flatten()
    .mapTo((x: number) => x + 1)

  useEffect(
    props$.map((props) => {
      return () => setCount(props.value)
    }),
  )
  useEffect(
    increment$.map((fn) => {
      return () => setCount(fn)
    }),
  )

  return unwrapVtree$(
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
    </div>,
  )
})
