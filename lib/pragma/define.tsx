import { a } from '@cycle/dom'
import { Component, WrappedComponent } from './types'

// only for proper typings :(
export function define<T>(component: Component<T>): WrappedComponent<T> {
  return (component as unknown) as WrappedComponent<T>
}
