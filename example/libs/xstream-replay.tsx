import xs, { Stream, MemoryStream, Subscription } from 'xstream'

export function replay<T>(source: Stream<T>) {
  let subject: MemoryStream<T>
  let refCount = 0
  let subscription: Subscription
  let innerSub: Subscription
  let hasError = false
  let hasValue = false
  let lastValue: T
  let isComplete = false

  const stream = xs.create<T>({
    start(listener) {
      refCount++

      if (!subject || hasError) {
        hasError = false
        subject = xs.createWithMemory<T>()
        subscription = source.subscribe({
          next(value) {
            hasValue = true
            lastValue = value
            subject.shamefullySendNext(value)
          },
          error(err) {
            hasError = true
            subject.shamefullySendError(err)
          },
          complete() {
            isComplete = true
            subject.shamefullySendComplete()
          },
        })
      }

      innerSub = subject.subscribe(listener)
    },
    stop() {
      refCount--
      innerSub.unsubscribe()
      if (subscription && refCount === 0 && isComplete) {
        subscription.unsubscribe()
      }
    },
  })

  const _add = stream._add.bind(stream)
  stream._add = function (il) {
    if (hasValue) {
      il._n(lastValue)
    }
    _add(il)
  }
  return stream
}
