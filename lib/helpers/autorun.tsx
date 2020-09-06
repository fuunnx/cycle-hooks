// probably make another lib for this operator

import xs, { MemoryStream, Listener, Subscription, Stream } from 'xstream'

// now that the tests are passing, needs cleanup / refactoring
export function autorun<T>(factory: (extractor) => T): MemoryStream<T> {
  let subscriptions: Map<Stream<any>, Subscription> = new Map()
  let unused: Map<Stream<any>, Subscription> = new Map()
  let listener: Listener<T>
  let values: WeakMap<Stream<any>, any> = new WeakMap()
  let completed: WeakSet<Stream<any>> = new WeakSet()

  function extractor<U>(stream: Stream<U>): U {
    try {
      if (values.has(stream)) {
        return values.get(stream)
      }

      if ((stream as any)._has) {
        values.set(stream, (stream as any)._v)
        return (stream as any)._v
      }

      throw 'magic_combine_wait'
    } finally {
      if (unused.has(stream)) {
        subscriptions.set(stream, unused.get(stream))
        unused.delete(stream)
      } else if (!subscriptions.has(stream) && !completed.has(stream)) {
        let canceled = false

        // prevents immediate resubscription
        subscriptions.set(stream, {
          unsubscribe() {
            canceled = true
            completed.add(stream)
            subscriptions.delete(stream)
            if (!subscriptions.size) {
              listener.complete()
            }
          },
        })

        var subscription = stream.subscribe({
          next(val) {
            if (!values.has(stream)) {
              values.set(stream, val)
              run()
              return
            }
            if (values.get(stream) !== val) {
              values.set(stream, val)
              run()
            }
          },
          error() {},
          complete() {
            completed.add(stream)
            subscription?.unsubscribe()
            subscriptions.delete(stream)
            if (!subscriptions.size) {
              listener.complete()
            }
          },
        })

        if (canceled) {
          subscription.unsubscribe()
        } else {
          subscriptions.set(stream, subscription)
        }
      }
    }
  }

  function run() {
    try {
      unused = subscriptions
      subscriptions = new Map()

      listener.next(factory(extractor))
    } catch (e) {
      if (e !== 'magic_combine_wait') listener.error(e)
    } finally {
      unused.forEach((x) => x.unsubscribe())

      if (!subscriptions.size) {
        listener.complete()
      }
    }
  }

  return xs.createWithMemory({
    start(l) {
      listener = l
      run()
    },
    stop() {},
  })
}
