import { h, VNode } from '@cycle/dom'
import { Component, ComponentDescription } from './types'

type VnodeData = {
  props: { [k: string]: any }
  attrs?: { [k: string]: string }
  on?: { [k: string]: EventListener }
  class?: { [k: string]: boolean }
  key?: string
}

function normalizeProps(props: { [k: string]: any }) {
  let result: VnodeData = { props }
  if (props.on) {
    result.on = props.on
  }
  if (props.class) {
    result.class = props.class
  }
  if (props.attrs) {
    result.attrs = props.attrs
  }
  if (props.props) {
    result.props = props.props
  }
  if (props.key) {
    result.key = props.key
  }

  return result
}

export function createElement<T extends { [k: string]: unknown }>(
  tagOrFunction: string | Component,
  props?: T,
  ...children: JSX.Element[]
): JSX.Element {
  if (typeof tagOrFunction === 'string') {
    if (props) {
      return h(tagOrFunction, normalizeProps(props), children as VNode[])
    }
    return h(tagOrFunction, children)
  }

  return {
    _isComponent: true,
    _function: tagOrFunction as Component,
    data: {
      ...normalizeProps(props || {}),
      children,
    },
  } as ComponentDescription
}

export function Fragment(...children: JSX.Element[]): JSX.Element[] {
  return children.flat(Infinity).filter(Boolean)
}
