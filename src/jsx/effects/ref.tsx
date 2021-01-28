import { MainDOMSource } from '@cycle/dom'
import { useID } from './id'
import { useSources } from '../../effects/sources'
import { AnyFunction } from '../../types'

export type Ref<T extends AnyFunction> = {
  selector: string
  DOM: MainDOMSource
  sinks: ReturnType<T>
}

export function useRef<T extends AnyFunction>(sel?: string): Ref<T> {
  const selector = `data-cycle-sel-${sel || useID()}` as const

  return {
    selector,
    DOM: useSources<{ DOM: MainDOMSource }>().DOM.select(`[${selector}]`),
    sinks: ({} as unknown) as ReturnType<T>, // TODO
  }
}
