import { useGlobalState } from '../lib/hooks/useGlobalState'
import { createElement } from '../lib/pragma'
import { unwrapVtree$ } from '../lib/helpers/unwrapVtree$'

export function Input() {
  const [state$, setState] = useGlobalState({})

  return state$.map((state) => (
    <input
      type="text"
      value={state.value || ''}
      on={{
        input(e) {
          setState({ value: e.target.value })
        },
      }}
    />
  ))
}
