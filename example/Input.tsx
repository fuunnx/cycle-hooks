import { useGlobalState } from '../src/hooks/useGlobalState'
import { createElement } from '../src/pragma'

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
