export interface SymbolFor<T> extends Symbol {}
export type ContextKey<T = unknown> = Symbol | string | SymbolFor<T>;
export type Context = Map<ContextKey, unknown>;

// TODO use real zones ? makes jest bug, so…

type ZoneProperties = [ContextKey, any][];
type Zone = {
  parent: Zone | null;
  content: Context;
  fork(properties: ZoneProperties): Zone;
};

let currentZone: Zone = Zone();

function Zone(parent: Zone = null, properties: ZoneProperties = []): Zone {
  const zone: Zone = {
    parent,
    content: new Map(properties),
    fork(properties: ZoneProperties) {
      return Zone(zone, properties);
    },
  };

  return zone;
}

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

export function withContext<T, U>(properties: ZoneProperties, exec: () => U): U;
export function withContext<T, U>(
  name: ContextKey<T>,
  value: T,
  exec: () => U
): U;
export function withContext<T, U>(
  name: ContextKey<T> | ZoneProperties,
  value: T | (() => U),
  exec?: () => U
): U {
  if (Array.isArray(name)) {
    const properties = name as ZoneProperties;
    exec = value as () => U;

    return withZone(useCurrentZone().fork(properties), exec);
  }

  return withZone(useCurrentZone().fork([[name, value]]), exec);
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
function resolveContext<T>(name: ContextKey<T>): T | typeof NOT_FOUND {
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
