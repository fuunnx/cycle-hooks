export interface InjectionKey<T> extends Symbol {}
export type EffectName<T = unknown> = symbol | string | InjectionKey<T> | number
type _EffectName<T = unknown> = symbol | string | number

type Handlers = Record<_EffectName, any>
type HandlersMap = Map<_EffectName, unknown>
type Frame = {
  parent: Frame | null
  handlers: HandlersMap
  forkWith(handlers: Handlers): Frame
}

let currentFrame: Frame = Frame()

function Frame(parent: Frame = null, handlers: Handlers = {}): Frame {
  const frame: Frame = {
    parent,
    handlers: new Map(Object.entries(handlers)),
    forkWith(handlers: Handlers) {
      return Frame(frame, handlers)
    },
  }

  return frame
}

export function useFrame() {
  return currentFrame
}

export function runWithFrame<T>(frame: Frame, exec: () => T): T {
  let frameBefore = currentFrame
  currentFrame = frame

  try {
    return exec()
  } finally {
    currentFrame = frameBefore
  }
}

export function withFrame<T extends any[], U>(
  frame: Frame,
  func: (...args: T) => U,
): (...args: T) => U {
  return (...args: T) => runWithFrame(frame, () => func(...args))
}

export function withHandlers<T extends [], U>(
  handlers: Handlers,
  func: (...args: T) => U,
): (...args: T) => U {
  return withFrame(useFrame().forkWith(handlers), func)
}

export function withHandler<E, T extends [], U>(
  name: EffectName<E>,
  value: E,
  func: (...args: T) => U,
): (...args: T) => U {
  return withFrame(useFrame().forkWith({ [name as symbol]: value }), func)
}

export function runWithHandler<T, U>(
  name: EffectName<T>,
  value: T,
  exec: () => U,
): U {
  return runWithHandlers({ [name as symbol]: value }, exec)
}

export function runWithHandlers<T, U>(handlers: Handlers, run: () => U): U {
  return runWithFrame(useFrame().forkWith(handlers), run)
}

export function safeUseContext<T>(name: EffectName<T>): T | undefined {
  const value = resolveHandler(name)
  if (value === NOT_FOUND) {
    return undefined
  }
  return value as T
}

export function useContext<T>(name: EffectName<T>): T {
  const value = resolveHandler(name)
  if (value === NOT_FOUND) {
    throw new Error(`Unknown key ${name.toString()} in context`)
  }
  return value as T
}

const NOT_FOUND = {} as const
function resolveHandler<T>(name: EffectName<T>): T | typeof NOT_FOUND
function resolveHandler<T>(name: EffectName<T>, defaultValue: T): T
function resolveHandler<T>(name: EffectName<T>, defaultValue?: T) {
  const _name = name as _EffectName<T>
  let origin = useFrame()
  if (origin.handlers.has(_name)) {
    return origin.handlers.get(_name)
  }

  let current = origin.parent
  while (current) {
    const ctx = current.handlers
    if (ctx.has(_name)) {
      const value = ctx.get(_name)
      origin.handlers.set(_name, value)
      return value
    }
    current = current.parent
  }

  if (defaultValue !== undefined) {
    return defaultValue
  }

  return NOT_FOUND
}
