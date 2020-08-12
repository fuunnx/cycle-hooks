export type TrackingLifecycle<T, Inst> = {
  create(type: T): Inst;
  use(instance: Inst, type: T): Inst;
  destroy(instance: Inst): void;
};
export type Tracker<T, Inst> = {
  open(): void;
  track(x: T): Inst;
  close(): void;
  destroy(): void;
  instances: Map<T, Inst>;
};

export function makeUsageTracker<T, Inst>(
  lifecycle: TrackingLifecycle<T, Inst>
): Tracker<T, Inst> {
  let unused: Map<T, Inst> = new Map();
  let instances: Map<T, Inst> = new Map();

  return {
    open() {
      unused = instances;
      instances = new Map();
    },

    track(type: T) {
      if (!unused.has(type) && !instances.has(type)) {
        instances.set(type, lifecycle.create(type));
      }

      if (unused.has(type)) {
        instances.set(type, unused.get(type));
        unused.delete(type);
      }

      if (instances.has(type)) {
        instances.set(type, lifecycle.use(instances.get(type), type));
      }

      return instances.get(type);
    },

    close() {
      unused.forEach((x) => lifecycle.destroy(x));
      unused = new Map();
    },

    destroy() {
      unused.forEach((x) => lifecycle.destroy(x));
      unused = new Map();

      instances.forEach((x) => lifecycle.destroy(x));
      instances = new Map();
    },

    get instances() {
      return instances;
    },
  };
}
