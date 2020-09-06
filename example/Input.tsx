import { useGlobalState } from '../lib/hooks/useGlobalState'
import { createElement } from '../lib/pragma'
import { unwrapVtree$ } from '../lib/helpers/unwrapVtree$'

export function Input() {
  const [state$, setState] = useGlobalState({})

  return unwrapVtree$(
    <input
      type="text"
      value={state$.map((x) => x.value || '')}
      on={{
        input(e) {
          setState({ value: e.target.value })
        },
      }}
    />,
  )
}
