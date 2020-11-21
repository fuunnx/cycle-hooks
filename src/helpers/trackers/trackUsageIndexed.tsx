import { TrackingLifecycle, makeUsageTracker, Tracker } from './trackUsage'

export type IndexedTracker<T, Inst> = {
  open(): void
  track(x: T): Inst
  close(): void
  destroy(): void
  instances: Map<T, Tracker<number, Inst>>
}

export function makeUsageTrackerIndexed<T, Inst>(
  lifecycle: TrackingLifecycle<T, Inst>,
): IndexedTracker<T, Inst> {
  let indexes: Map<T, number> = new Map()
  const tracker = makeUsageTracker<T, Tracker<number, Inst>>({
    create(type: T) {
      indexes.set(type, 0)
      const innerTracker = makeUsageTracker<number, Inst>({
        create() {
          return lifecycle.create(type)
        },
        use(inst) {
          return lifecycle.use(inst, type)
        },
        destroy(inst: Inst) {
          return lifecycle.destroy(inst)
        },
      })
      innerTracker.open()
      return innerTracker
    },
    use(instance, type) {
      const index = indexes.get(type)
      instance.track(index)
      indexes.set(type, index + 1)
      return instance
    },
    destroy(instance) {
      instance.destroy()
    },
  })

  return {
    ...tracker,
    open() {
      for (const key of tracker.instances.keys()) {
        const instance = tracker.instances.get(key)
        indexes.set(key, 0)
        instance.open()
      }
      tracker.open()
    },
    close() {
      for (const instance of tracker.instances.values()) {
        instance.close()
      }
      tracker.close()
    },
    destroy() {
      for (const instance of tracker.instances.values()) {
        instance.destroy()
      }
      tracker.destroy()
      indexes = new Map()
    },
    track(type) {
      const indexed = tracker.track(type)
      return indexed.instances.get(indexes.get(type) - 1)
    },
    get instances() {
      return tracker.instances
    },
  }
}
