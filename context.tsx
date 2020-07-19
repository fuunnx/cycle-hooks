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

export function withZone<T>(zone: Zone, exec: () => T): T {
  let zoneBefore = currentZone;
  currentZone = zone;
  try {
    return exec();
  } finally {
    currentZone = zoneBefore;
  }
}

export function withContext<T, U>(
  name: ContextKey<T>,
  value: T,
  exec: () => U
): U {
  return withZone(
    {
      parent: useCurrentZone(),
      content: new Map([[name, value]]),
    },
    exec
  );
}

export function safeUseContext<T>(name: ContextKey<T>): T | undefined {
  const value = resolveContext(name);
  return value === NOT_FOUND ? undefined : (value as T);
}

export function useContext<T>(name: ContextKey<T>): T {
  const value = resolveContext(name);
  if (value === NOT_FOUND) {
    throw new Error(`Unknown key ${name} in context`);
  }
  return value as T;
}

const NOT_FOUND = {} as const;
export function resolveContext<T>(name: ContextKey<T>): T | typeof NOT_FOUND {
  let current = useCurrentZone();
  while (current) {
    const ctx = current.content;
    if (ctx?.has(name)) {
      return ctx.get(name);
    }
    current = current.parent;
  }
  return NOT_FOUND;
}
