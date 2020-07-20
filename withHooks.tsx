import { sourcesKey } from "./sources";
import { refSymbol, Ref } from "./pragma";
import { forkZone, useCurrentZone, withZone } from "./context";
import { Sinks, Sources } from "./types";
import { sinksGatherer } from "./sinks";
import { mergeSinks } from "cyclejs-utils";
import { MemoryStream } from "xstream";

export function withHooks<So extends Sources, Si extends Sinks>(
  App: () => Si | MemoryStream<any>,
  sinksNames: string[]
): (sources: So) => Si {
  return function AppWithHooks(sources: So): Si {
    const [gathered, sinks] = sinksGatherer(sinksNames)(() => {
      const injections = [
        [sourcesKey, sources],
        [refSymbol, Ref()],
      ];
      return withZone(forkZone(useCurrentZone(), injections as any), App);
    });

    if (sinks.DOM) {
      return mergeSinks([gathered, sinks]);
    }

    return mergeSinks([gathered, { DOM: sinks }]);
  };
}
