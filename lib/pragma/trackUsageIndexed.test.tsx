import { makeUsageTrackerIndexed } from "./trackUsageIndexed";

function serialize(actual) {
  return Object.fromEntries(
    [...actual.entries()].map(([k, v]) => [k, [...v.instances.values()]])
  );
}

test("trackUsageIndexed : append on usage", () => {
  const tracker = makeUsageTrackerIndexed<number, number>({
    create(index) {
      return index;
    },
    use(inst) {
      return inst;
    },
    destroy() {},
  });

  tracker.open();
  tracker.track(1);
  tracker.track(2);
  tracker.track(1);
  tracker.close();

  const actual = tracker.instances;
  expect(serialize(actual)).toEqual({
    1: [1, 1],
    2: [2],
  });
});

test("trackUsageIndexed : multiple lifecycles", () => {
  const tracker = makeUsageTrackerIndexed<number, number>({
    create(index) {
      return index;
    },
    use(inst) {
      return inst;
    },
    destroy() {},
  });

  tracker.open();
  tracker.track(1);
  tracker.track(2);
  tracker.track(1);
  tracker.close();

  tracker.open();
  tracker.track(1);
  tracker.close();

  const actual = tracker.instances;
  expect(serialize(actual)).toEqual({
    1: [1],
  });
});

test("trackUsageIndexed : 'create' is called on the right time", () => {
  const calls = [];
  const tracker = makeUsageTrackerIndexed<number, number>({
    create(index) {
      calls.push(index);
      return index;
    },
    use(inst) {
      return inst;
    },
    destroy() {},
  });

  tracker.open();
  tracker.track(1);
  tracker.track(2);
  tracker.track(1);
  tracker.close();

  tracker.open();
  tracker.track(1);
  tracker.close();

  tracker.open();
  tracker.track(2);
  tracker.close();

  expect(calls).toEqual([1, 2, 1, 2]);
});

test("trackUsageIndexed : 'use' is called at every usage", () => {
  const calls = [];
  const tracker = makeUsageTrackerIndexed<number, number>({
    create(index) {
      return index;
    },
    use(inst) {
      calls.push(inst);
      return inst;
    },
    destroy() {},
  });

  tracker.open();
  tracker.track(1);
  tracker.track(2);
  tracker.track(2);
  tracker.close();

  tracker.open();
  tracker.track(1);
  tracker.close();

  tracker.open();
  tracker.track(2);
  tracker.close();

  expect(calls).toEqual([1, 2, 2, 1, 2]);
});

test("trackUsageIndexed : 'destroy' is called on destroy", () => {
  const calls = [];
  const tracker = makeUsageTrackerIndexed<number, number>({
    create(index) {
      return index;
    },
    use(inst) {
      return inst;
    },
    destroy(inst) {
      calls.push(inst);
    },
  });

  tracker.open();
  tracker.track(1);
  tracker.track(2);
  tracker.track(2);
  tracker.close();

  tracker.open();
  tracker.track(1);
  tracker.close();

  tracker.open();
  tracker.track(2);
  tracker.close();

  expect(calls).toEqual([2, 2, 1]);
});
