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
  let isOpen = false;

  return {
    open() {
      if (isOpen) throw new Error("tracker is already open");

      unused = instances;
      instances = new Map();

      isOpen = true;
    },

    track(type: T) {
      if (!isOpen) {
        throw new Error("tracker is closed " + type);
      }

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
      if (!isOpen) throw new Error("tracker is already close");

      unused.forEach((x) => lifecycle.destroy(x));
      unused = new Map();

      isOpen = false;
    },

    destroy() {
      unused.forEach((x) => lifecycle.destroy(x));
      unused = new Map();

      instances.forEach((x) => lifecycle.destroy(x));
      instances = new Map();

      isOpen = false;
    },

    get instances() {
      return instances;
    },
  };
}
