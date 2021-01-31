import { MainDOMSource } from '@cycle/dom'
import { useID } from './id'
import { useSources } from './sources'


// TODO use data attributes — this selector is not supported by cycle/dom
type Selector = `#data-cycle-sel-${string}`

export type Ref = [
  Selector,
  MainDOMSource,
]

export function useSel(sel?: string): Ref {
  const selector = `#data-cycle-sel-${sel || useID()}` as const

  return [
    selector,
    useSources<{ DOM: MainDOMSource }>().DOM.select(selector)
  ]
}
