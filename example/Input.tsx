import { input } from '@cycle/dom'
import { useSel } from '../src/effects/sel'
import { Atom } from './libs/Atom'
import xs, { Stream } from 'xstream'

// it's painful to wrap/unwrap the atomSource in an observable
export function Input(state: Atom<string>) {
  const [inputSel, inputDOM] = useSel()

  const state$ = state.modify(
    inputDOM
      .events('input')
      .map((event) => (event.target as any).value as string)
      .startWith('')
      .map((value) => (_) => value),
  )

  return {
    DOM: state$.map((state) =>
      input(inputSel, { props: { type: 'text', value: state || '' } }),
    ),
  }
}
