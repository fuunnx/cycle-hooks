import { MainDOMSource } from '@cycle/dom'
import { useID } from './id'
import { useSources } from './sources'

export type Ref = {
  selector: string
  DOM: MainDOMSource
}

export function useRef(sel?: string): Ref {
  const selector = `data-cycle-sel-${sel || useID()}`

  return {
    selector,
    DOM: useSources<{ DOM: MainDOMSource }>().DOM.select(`[${selector}]`),
  }
}
