import { makeUsageTrackerKeyed } from './trackUsageKeyed'

test('trackUsageKeyed', () => {
  let methods = []
  const tracker = makeUsageTrackerKeyed<[string, Function], string>({
    create([key]) {
      methods.push(`create ${key}`)
      return key
    },
    use(inst, [key]) {
      methods.push(`use ${key}`)
      return inst
    },
    destroy() {
      methods.push(`destroy`)
    },
  })

  function Component() {}

  tracker.open()
  tracker.track(['key1', Component])
  tracker.track(['key2', Component])
  tracker.close()

  tracker.open()
  tracker.track(['key1', Component])
  tracker.close()

  expect(methods).toEqual([
    'create key1',
    'use key1',
    'create key2',
    'use key2',
    'use key1',
    'destroy',
  ])
})
