import { Sinks } from "./types";

let globalSinks = {
  register: null,
};
export function gatherSinks<T>(func: () => T): [Sinks, T] {
  let previous = globalSinks.register;
  let sinks = {};
  globalSinks.register = function registerSinks(registered) {
    sinks = mergeSinks([sinks, registered]);
  };
  const returnValue = func();
  globalSinks.register = previous;
  return [sinks, returnValue];
}

export function registerSinks(sinks: Sinks) {
  if (!globalSinks.register) throw new Error("nop");
  const stop$ = useUnmount();
  return globalSinks.register(map((sink$) => sink$.endWhen(stop$), sinks));
}

// TODO
export function mergeSinks(sinks: [Sinks, Sinks]) {
  return sinks[0];
}
