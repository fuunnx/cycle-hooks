import xs from 'xstream'
import { makeSubject } from '../lib/driver'
import { createElement } from '../lib'
import { unwrapVtree$ } from '../lib/helpers/unwrapVtree$'

export const Timer = () => {
  const [reset$, reset] = makeSubject()

  return unwrapVtree$(
    <div>
      Count :
      {reset$
        .startWith(null)
        .map(() => xs.periodic(500).startWith(0))
        .flatten()}
      <button on={{ click: reset }}>Reset</button>
    </div>,
  )
}
