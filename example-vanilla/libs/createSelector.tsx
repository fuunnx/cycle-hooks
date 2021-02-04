import { MainDOMSource } from '@cycle/dom'

export function createSelector(sources: {
  DOM: MainDOMSource
  createID: () => string
}) {
  const { DOM, createID } = sources
  const id = `#selector-${createID()}`
  return [id, DOM.select(id)] as const
}
