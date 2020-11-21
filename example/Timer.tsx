import xs from 'xstream'
import { useSubject } from '../src/helpers/subjects'
import { createElement } from '../src'

export const Timer = () => {
  const [reset$, reset] = useSubject()
  const count$ = reset$
    .startWith(null)
    .map(() => xs.periodic(500).startWith(0))
    .flatten()

  return {
    DOM: count$.map((count) => (
      <div>
        Count: {count}
        <button on={{ click: reset }}>Reset</button>
      </div>
    )),
  }
}
