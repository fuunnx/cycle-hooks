import { Stream } from 'xstream'

export type Sources = {
  [key: string]: any
}

export type Sinks = {
  [key: string]: Stream<unknown>
  DOM?: Stream<JSX.Element>
}

export type MainFn<So extends Sources, Si extends Sinks> = {
  (sources?: So): Si
}
