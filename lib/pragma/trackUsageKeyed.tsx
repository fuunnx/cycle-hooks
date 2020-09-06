import MultiKeyCache from 'multi-key-cache'

export type TrackingLifecycle<T, Inst> = {
  create(type: T): Inst
  use(instance: Inst, type: T): Inst
  destroy(instance: Inst): void
}
export type KeyedTracker<T extends Array<unknown>, Inst> = {
  open(): void
  track(x: T): Inst
  close(): void
  destroy(): void
  instances: MultiKeyCache<T, Inst>
}

export function makeUsageTrackerKeyed<T extends Array<unknown>, Inst>(
  lifecycle: TrackingLifecycle<T, Inst>,
): KeyedTracker<T, Inst> {
  let unused: MultiKeyCache<T, Inst> = new MultiKeyCache()
  let instances: MultiKeyCache<T, Inst> = new MultiKeyCache()
  let isOpen = false

  return {
    open() {
      if (isOpen) throw new Error('tracker is already open')

      unused = instances
      instances = new MultiKeyCache()

      isOpen = true
    },

    track(type: T) {
      if (!isOpen) {
        throw new Error('tracker is closed ' + type)
      }

      if (!unused.has(type) && !instances.has(type)) {
        instances.set(type, lifecycle.create(type))
      }

      if (unused.has(type)) {
        instances.set(type, unused.get(type))
        unused.delete(type)
      }

      if (instances.has(type)) {
        instances.set(type, lifecycle.use(instances.get(type), type))
      }

      return instances.get(type)
    },

    close() {
      if (!isOpen) throw new Error('tracker is already close')

      unused.values().forEach((x) => lifecycle.destroy(x))
      unused = new MultiKeyCache()

      isOpen = false
    },

    destroy() {
      unused.values().forEach((x) => lifecycle.destroy(x))
      unused = new MultiKeyCache()

      instances.values().forEach((x) => lifecycle.destroy(x))
      instances = new MultiKeyCache()

      isOpen = false
    },

    get instances() {
      return instances
    },
  }
}
