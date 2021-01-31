import { useGlobalState } from './hooks/globalState'
import { AppState } from '.'
import { input } from '@cycle/dom'
import { useSel } from '../src/effects/sel'

export function Input() {
  const [inputSel, inputDOM] = useSel()

  const value$ = inputDOM
    .events('input')
    .map((event) => (event.target as any).value as string)
    .startWith('')

  const state$ = useGlobalState<AppState>(value$.map((value) => ({ value })))

  return {
    DOM: state$.map((state) =>
      input(inputSel, { props: { type: 'text', value: state.value || '' } }),
    ),
  }
}
