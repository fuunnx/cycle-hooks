import xs from 'xstream'
import { useSubject } from '../src/hooks/subject'
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
        <button onClick={reset}>Reset</button>
      </div>
    )),
  }
}
