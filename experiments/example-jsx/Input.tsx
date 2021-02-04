import { useGlobalState } from './hooks/globalState'
import { createElement } from '../jsx'

export function Input() {
  const [state$, setState] = useGlobalState({})

  return state$.map((state) => (
    <input
      type="text"
      value={state.value || ''}
      onInput={(e) => {
        setState({ value: e.target.value })
      }}
    />
  ))
}
