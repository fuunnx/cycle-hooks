import { useGlobalState } from './hooks/globalState'
import { AppState, useAppSources } from '.'
import { input } from '@cycle/dom'

export function Input() {
  const { DOM } = useAppSources()

  const value$ = DOM.select('#input')
    .events('input')
    .map((event) => (event.target as any).value)
    .startWith('')

  const state$ = useGlobalState<AppState>(value$)

  return {
    DOM: state$.map((state) =>
      input({ props: { id: 'input', type: 'text', value: state.value || '' } }),
    ),
  }
}
