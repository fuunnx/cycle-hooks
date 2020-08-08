import "../patches/xstream";

import { Sources } from "../types";
import { ContextKey, withContext, useContext, safeUseContext } from ".";

export const sourcesKey: ContextKey<Sources> = Symbol("sources");

export function provideSources<T>(sources: Sources, func: () => T) {
  return withContext(sourcesKey, sources, func);
}

export function useSources() {
  return useContext(sourcesKey);
}

export function safeUseSources() {
  return safeUseContext(sourcesKey);
}
