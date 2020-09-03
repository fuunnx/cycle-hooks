import { useGlobalState } from '../lib/hooks/useGlobalState'
import { createElement } from '../lib/pragma'

export function Input() {
  const [state$, setState] = useGlobalState({})

  return (
    <input
      type="text"
      value={state$.map((x) => x.value || '')}
      on={{
        input(e) {
          setState({ value: e.target.value })
        },
      }}
    />
  )
}
