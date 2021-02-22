import { MainDOMSource } from '@cycle/dom'
import { createID } from './id'
import { useSources } from './sources'


// TODO use data attributes — data selectors are not supported by cycle/dom
type Selector = `#data-cycle-sel-${string}`

export type Ref = [
  Selector,
  MainDOMSource,
]

export function createSelector(sel?: string): Ref {
  const selector = `#data-cycle-sel-${sel || createID()}` as const

  return [
    selector,
    useSources<{ DOM: MainDOMSource }>().DOM.select(selector)
  ]
}
