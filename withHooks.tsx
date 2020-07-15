import { MainFn, Sources } from "./types";
import { gatherSinks, mergeSinks } from "./sinks";
import { provideSources } from "./sources";

export function withHooks(App: MainFn) {
  return function appWithHooks(sources: Sources) {
    const [sinks, returnValue] = gatherSinks(() =>
      provideSources(sources, App)
    );

    return mergeSinks([sinks, returnValue]);
  };
}
