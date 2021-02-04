import { makeUsageTracker } from './trackUsage'

test('trackUsage : append on usage', () => {
  const tracker = makeUsageTracker<number, number>({
    create(index) {
      return index
    },
    use(inst) {
      return inst
    },
    destroy() {},
  })

  tracker.open()
  tracker.track(1)
  tracker.track(2)
  tracker.close()

  const actual = tracker.instances
  expect(Object.fromEntries(actual.entries())).toEqual({
    1: 1,
    2: 2,
  })
})

test('trackUsage : multiple lifecycles', () => {
  const tracker = makeUsageTracker<number, number>({
    create(index) {
      return index
    },
    use(inst) {
      return inst
    },
    destroy() {},
  })

  tracker.open()
  tracker.track(1)
  tracker.track(2)
  tracker.close()

  tracker.open()
  tracker.track(1)
  tracker.close()

  const actual = tracker.instances
  expect(Object.fromEntries(actual.entries())).toEqual({
    1: 1,
  })
})

test("trackUsage : 'create' is called on the right time", () => {
  const calls = []
  const tracker = makeUsageTracker<number, number>({
    create(index) {
      calls.push(index)
      return index
    },
    use(inst) {
      return inst
    },
    destroy() {},
  })

  tracker.open()
  tracker.track(1)
  tracker.track(2)
  tracker.close()

  tracker.open()
  tracker.track(1)
  tracker.close()

  tracker.open()
  tracker.track(2)
  tracker.close()

  expect(calls).toEqual([1, 2, 2])
})

test("trackUsage : 'use' is called at every usage", () => {
  const calls = []
  const tracker = makeUsageTracker<number, number>({
    create(index) {
      return index
    },
    use(inst) {
      calls.push(inst)
      return inst
    },
    destroy() {},
  })

  tracker.open()
  tracker.track(1)
  tracker.track(2)
  tracker.track(2)
  tracker.close()

  tracker.open()
  tracker.track(1)
  tracker.close()

  tracker.open()
  tracker.track(2)
  tracker.close()

  expect(calls).toEqual([1, 2, 2, 1, 2])
})

test("trackUsage : 'destroy' is called on destroy", () => {
  const calls = []
  const tracker = makeUsageTracker<number, number>({
    create(index) {
      return index
    },
    use(inst) {
      return inst
    },
    destroy(inst) {
      calls.push(inst)
    },
  })

  tracker.open()
  tracker.track(1)
  tracker.track(2)
  tracker.track(2)
  tracker.close()

  tracker.open()
  tracker.track(1)
  tracker.close()

  tracker.open()
  tracker.track(2)
  tracker.close()

  expect(calls).toEqual([2, 1])
})
