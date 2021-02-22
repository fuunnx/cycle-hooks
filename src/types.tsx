import { Stream } from 'xstream'

export type AnySources = {
  [key: string]: any
}

export type AnySinks = {
  [key: string]: Stream<unknown>
}

export type Main<So extends AnySources, Si extends AnySinks> = {
  (sources?: So): Si
}

export type AnyFunction = (...args: any[]) => any
