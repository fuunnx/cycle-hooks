import { useGlobalState } from '../lib/hooks/useGlobalState'
import { createElement } from '../lib/pragma'

export function Input() {
  const [state$, setState] = useGlobalState({})

  return {
    DOM: state$.map((state) => (
      <input
        type="text"
        value={state.value || ''}
        on={{
          input(e) {
            setState({ value: e.target.value })
          },
        }}
      />
    )),
  }
}
