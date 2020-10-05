import xs from 'xstream'
import { useSubject } from '../lib/helpers/subjects'
import { createElement } from '../lib'

export const Timer = () => {
  const [reset$, reset] = useSubject()
  const count$ = reset$
    .startWith(null)
    .map(() => xs.periodic(500).startWith(0))
    .flatten()

  return count$.map((count) => (
    <div>
      Count: {count}
      <button on={{ click: reset }}>Reset</button>
    </div>
  ))
}
