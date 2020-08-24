import { Component } from ".";

// only for proper typings :(
export function define<T>(component: Component<T>) {
  return Object.assign(() => component as Component<T> & { _props: T }, {
    _isWrappedComponent: true,
  });
}
