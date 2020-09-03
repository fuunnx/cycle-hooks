import { a } from '@cycle/dom'
import { Component, WrappedComponent } from '.'

// only for proper typings :(
export function define<T>(component: Component<T>): WrappedComponent<T> {
  return component as WrappedComponent<T>
}
