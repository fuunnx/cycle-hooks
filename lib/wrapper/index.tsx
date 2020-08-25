import { sourcesKey } from "../context/sources";
import { refSymbol, Ref } from "../pragma/ref";
import { withContext } from "../context";
import { Sinks, Sources } from "../types";
import { gatherSinks } from "../context/sinks";
import { mergeSinks } from "../helpers";
import xs, { MemoryStream, Stream } from "xstream";
import { Reducer } from "@cycle/state";
import { trackChildren } from "../pragma";

type AppSinks = Sinks & {
  state: Stream<Reducer<unknown>>;
};

export function withHooks(
  App: () => Sinks | MemoryStream<any>,
  sinksNames: string[]
): (sources: Sources) => AppSinks {
  return function AppWithHooks(sources: Sources): AppSinks {
    const [gathered, sinks] = gatherSinks(sinksNames, () => {
      return withContext(
        [
          [sourcesKey, sources],
          [refSymbol, Ref()],
        ],
        App
      );
    });

    const finalSinks =
      "DOM" in sinks
        ? mergeSinks([gathered, sinks])
        : mergeSinks([gathered, { DOM: sinks } as Sinks]);

    return {
      state: xs.empty(),
      ...finalSinks,
      DOM: trackChildren(finalSinks.DOM as any),
    };
  };
}
