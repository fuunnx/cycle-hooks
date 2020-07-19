import "./patches/xstream";
import { Sources } from "./types";

let globalSources: { current: Sources | null } = { current: null };
export function provideSources<T>(sources: Sources, func: () => T) {
  let previous = globalSources.current;
  globalSources.current = sources;
  const returnValue = func();
  globalSources.current = previous;
  return returnValue;
}

export function useSources<T extends Sources>() {
  const soures = safeUseSources();
  if (!soures) throw new Error("Using useSources from outside");
  return soures as T;
}
export function safeUseSources<T extends Sources>() {
  return globalSources.current as T;
}
