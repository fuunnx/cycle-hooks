import { makeUsageTrackerKeyed } from './trackUsageKeyed'

test('trackUsageKeyed', () => {
  let methods = []
  const tracker = makeUsageTrackerKeyed<[string, Function], string, [string]>({
    create([key], value) {
      methods.push(`create ${key} with value ${value}`)
      return key
    },
    use(inst, [key], value) {
      methods.push(`use ${key} with value ${value}`)
      return inst
    },
    destroy() {
      methods.push(`destroy`)
    },
  })

  function Component() {}

  tracker.open()
  tracker.track(['key1', Component], '1')
  tracker.track(['key2', Component], '1')
  tracker.close()

  tracker.open()
  tracker.track(['key1', Component], '2')
  tracker.close()

  expect(methods).toEqual([
    'create key1 with value 1',
    'use key1 with value 1',
    'create key2 with value 1',
    'use key2 with value 1',
    'use key1 with value 2',
    'destroy',
  ])
})
