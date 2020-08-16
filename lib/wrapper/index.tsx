import { sourcesKey } from "../context/sources";
import { refSymbol, Ref } from "../pragma/ref";
import { forkZone, useCurrentZone, withZone } from "../context";
import { Sinks, Sources } from "../types";
import { sinksGatherer } from "../context/sinks";
import { mergeSinks, isObservable } from "../helpers";
import xs, { MemoryStream, Stream } from "xstream";
import { Reducer } from "@cycle/state";

type AppSinks = Sinks & {
  state: Stream<Reducer<unknown>>;
};

export function withHooks(
  App: () => Sinks | MemoryStream<any>,
  sinksNames: string[]
): (sources: Sources) => AppSinks {
  return function AppWithHooks(sources: Sources): AppSinks {
    const [gathered, sinks] = sinksGatherer(sinksNames)(() => {
      const injections = [
        [sourcesKey, sources],
        [refSymbol, Ref()],
      ];
      return withZone(forkZone(useCurrentZone(), injections as any), App);
    });

    // TODO check if DOM is an observable, or else lift it as one

    const finalSinks =
      "DOM" in sinks
        ? mergeSinks([gathered, sinks])
        : mergeSinks([gathered, { DOM: sinks } as Sinks]);

    return {
      state: xs.empty(),
      ...finalSinks,
      DOM: (isObservable(finalSinks.DOM)
        ? finalSinks.DOM
        : xs.of(finalSinks.DOM)
      )
        .map((x) => (isObservable(x) ? x : xs.of(x)))
        .flatten(),
    };
  };
}
