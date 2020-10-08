interface InjectionKey<T> extends Symbol {}
export type EffectName<T extends Handler = () => unknown> =
  | symbol
  | string
  | InjectionKey<T>
  | number
type _EffectName<T = unknown> = symbol | string | number

type Handler<R = any, Args extends any[] = any[]> = (...args: Args) => R
type Handlers = Record<_EffectName, Handler>
type Frame = {
  parent: Frame | null
  handlers: Handlers
  withHandlers(handlers: Handlers): Frame
}

let currentFrame: Frame = Frame()

function Frame(parent: Frame = null, handlers: Handlers = {}): Frame {
  const frame: Frame = {
    parent,
    handlers,
    withHandlers(handlers: Handlers) {
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

export function withHandlers<T extends any[], U>(
  handlers: Handlers,
  func: (...args: T) => U,
): (...args: T) => U {
  return withFrame(useFrame().withHandlers(handlers), func)
}

export function withHandler<H extends Handler, T extends any[], U>(
  name: EffectName<H>,
  handler: H,
  func: (...args: T) => U,
): (...args: T) => U {
  return withFrame(useFrame().withHandlers({ [name as symbol]: handler }), func)
}

export function runWithHandler<H extends Handler, U>(
  name: EffectName<H>,
  handler: H,
  exec: () => U,
): U {
  return runWithHandlers({ [name as symbol]: handler }, exec)
}

export function runWithHandlers<U>(handlers: Handlers, run: () => U): U {
  return runWithFrame(useFrame().withHandlers(handlers), run)
}

export function performSafe<R, Args extends any[]>(
  name: EffectName<Handler<R, Args>>,
  ...args: Args
): R | undefined {
  const handler = resolveHandler(name)
  if (handler === NOT_FOUND) {
    return undefined
  }
  return handler(...args)
}

export function perform<R, Args extends any[]>(
  name: EffectName<Handler<R, Args>>,
  ...args: Args
): R {
  const handler = resolveHandler(name)
  if (handler === NOT_FOUND) {
    throw new Error(`Unknown handler for ${name.toString()} in current frame`)
  }
  return handler(...args)
}

const NOT_FOUND = Symbol('HANDLER_NOT_FOUND')
function resolveHandler<T extends Handler>(
  name: EffectName<T>,
): T | typeof NOT_FOUND
function resolveHandler<T extends Handler>(
  name: EffectName<T>,
  defaultValue: T,
): T
function resolveHandler<T extends Handler>(
  name: EffectName<T>,
  defaultValue?: T,
) {
  const _name = name as _EffectName<T>
  let origin = useFrame()
  if (_name in origin.handlers) {
    return withFrame(origin.parent, origin.handlers[_name as string])
  }

  let current = origin.parent
  while (current) {
    const ctx = current.handlers
    if (_name in ctx) {
      return withFrame(current.parent, ctx[_name as string])
    }
    current = current.parent
  }

  if (defaultValue !== undefined) {
    return defaultValue
  }

  return NOT_FOUND
}
