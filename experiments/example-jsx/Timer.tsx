import xs from 'xstream'
import { useSubject } from './hooks/subject'
import { createElement } from '../jsx'

export const Timer = () => {
  const [reset$, reset] = useSubject()
  const count$ = reset$
    .startWith(null)
    .map(() => xs.periodic(500).startWith(0))
    .flatten()

  return count$.map((count) => (
    <div>
      Count: {count}
      <button onClick={reset}>Reset</button>
    </div>
  ))
}
