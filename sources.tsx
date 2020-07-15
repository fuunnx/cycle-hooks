import { Sources } from "./types";

let globalSources: { current: Sources | null } = { current: null };
export function provideSources<T>(sources: Sources, func: () => T) {
  let previous = globalSources.current;
  globalSources.current = { ...globalSources.current, ...sources };
  const returnValue = func();
  globalSources.current = previous;
  return returnValue;
}

export function useSources<T extends Sources>() {
  if (!globalSources.current) throw new Error("nop");
  return globalSources.current as T;
}
