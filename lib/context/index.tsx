export interface SymbolFor<T> extends Symbol {}
export type ContextKey<T = unknown> = Symbol | string | SymbolFor<T>;
export type Context = Map<ContextKey, unknown>;

// TODO use real zones ? makes jest bug, so…
type Zone = {
  parent: Zone | null;
  content: Context;
};

let currentZone: Zone = { parent: null, content: new Map() };
export function useCurrentZone() {
  return currentZone;
}

export function forkZone(zone: Zone, properties: [ContextKey, any][]) {
  return {
    parent: zone,
    content: new Map(properties),
  };
}

export function withZone<T>(zone: Zone, exec: () => T): T {
  let zoneBefore = currentZone;
  currentZone = zone;
  // console.log("->", zone, exec.toString());
  try {
    return exec();
  } finally {
    currentZone = zoneBefore;
    // console.log("<-", zone);
  }
}

export function withContext<T, U>(
  name: ContextKey<T>,
  value: T,
  exec: () => U
): U {
  return withZone(forkZone(useCurrentZone(), [[name, value]]), exec);
}

export function safeUseContext<T>(name: ContextKey<T>): T | undefined {
  const value = resolveContext(name);
  return value === NOT_FOUND ? undefined : (value as T);
}

export function useContext<T>(name: ContextKey<T>): T {
  const value = resolveContext(name);
  if (value === NOT_FOUND) {
    throw new Error(`Unknown key ${name.toString()} in context`);
  }
  return value as T;
}

const NOT_FOUND = {} as const;
export function resolveContext<T>(name: ContextKey<T>): T | typeof NOT_FOUND {
  let origin = useCurrentZone();
  if (origin.content.has(name)) {
    return origin.content.get(name);
  }

  let current = origin.parent;
  while (current) {
    const ctx = current.content;
    if (ctx.has(name)) {
      const value = ctx.get(name);
      origin.content.set(name, value);
      return value;
    }
    current = current.parent;
  }
  return NOT_FOUND;
}
