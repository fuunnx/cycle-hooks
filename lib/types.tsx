import { Stream } from "xstream";

export type Sources = {
  [key: string]: any;
};

export type Sinks = {
  [key: string]: Stream<unknown>;
};

export type MainFn = {
  (sources?: Sources): Sinks;
};
