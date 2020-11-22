import { useGlobalState } from '../src/hooks/globalState'
import { createElement } from '../src/pragma'

export function Input() {
  const [state$, setState] = useGlobalState({})

  return {
    DOM: state$.map((state) => (
      <input
        type="text"
        value={state.value || ''}
        onInput={(e) => {
          setState({ value: e.target.value })
        }
      />
    )),
  }
}
