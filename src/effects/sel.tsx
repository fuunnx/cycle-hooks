import { MainDOMSource } from '@cycle/dom'
import { useID } from '../jsx/effects/id'
import { useSources } from './sources'

type Selector = `[data-cycle-sel-${string}]`

export type Ref = [
  Selector,
  MainDOMSource,
]

export function useSel(sel?: string): Ref {
  const selector = `[data-cycle-sel-${sel || useID()}]` as const

  return [
    selector,
    useSources<{ DOM: MainDOMSource }>().DOM.select(selector)
  ]
}
