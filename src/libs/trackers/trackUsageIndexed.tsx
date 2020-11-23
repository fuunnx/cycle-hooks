import { TrackingLifecycle, makeUsageTracker, Tracker } from './trackUsage'

export type IndexedTracker<T, Inst, U extends Array<unknown> = []> = {
  open(): void
  track(x: T, ...payload: U): Inst
  close(): void
  destroy(): void
  instances: Map<T, Tracker<number, Inst, U>>
}

export function makeUsageTrackerIndexed<T, Inst, U extends Array<unknown> = []>(
  lifecycle: TrackingLifecycle<T, Inst, U>,
): IndexedTracker<T, Inst, U> {
  let indexes: Map<T, number> = new Map()
  const tracker = makeUsageTracker<T, Tracker<number, Inst, U>, U>({
    create(type: T, ...payload: U) {
      indexes.set(type, 0)
      const innerTracker = makeUsageTracker<number, Inst, U>({
        create() {
          return lifecycle.create(type, ...payload)
        },
        use(inst, ..._) {
          return lifecycle.use(inst, type, ...payload)
        },
        destroy(inst: Inst) {
          return lifecycle.destroy(inst)
        },
      })
      innerTracker.open()
      return innerTracker
    },
    use(instance, type, ...payload) {
      const index = indexes.get(type)
      instance.track(index, ...payload)
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
    track(type: T, ...payload: U) {
      const indexed = tracker.track(type, ...payload)
      return indexed.instances.get(indexes.get(type) - 1)
    },
    get instances() {
      return tracker.instances
    },
  }
}
