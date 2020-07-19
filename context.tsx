// import "zone.js";
export interface SymbolFor<T> extends Symbol {}
export type ContextKey<T = unknown> = Symbol | string | SymbolFor<T>;
export type Context = Map<ContextKey, unknown>;

// const key = "$$cycle-hooks-context";
let context: Context = new Map();

export function withContext<T, U>(
  name: ContextKey<T>,
  value: T,
  exec: () => U
): U {
  const hadBefore = context.has(name);
  let before = context.get(name);
  context.set(name, value);
  const result = exec();

  if (hadBefore) {
    context.set(name, before);
  } else {
    context.delete(name);
  }
  return result;
}

export function safeUseContext<T>(name: ContextKey<T>): T | undefined {
  const ctx = resolveContext();
  return ctx.get(name) as T | undefined;
}

export function useContext<T>(name: ContextKey<T>): T {
  const ctx = resolveContext();
  if (!ctx.has(name)) {
    throw new Error(`Unknown key ${name} in context`);
  }
  return ctx.get(name) as T;
}

export function resolveContext(): Context | null {
  return context;
}
