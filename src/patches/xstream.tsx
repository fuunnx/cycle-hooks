import { Stream, InternalProducer, NO } from 'xstream'
import { captureFrame, withFrame } from 'performative-ts'
import { withUnmount } from '../withEffects/unmount'
import { setAdapt } from '@cycle/run/lib/adapt'

setAdapt((x) => {
  patch(x)
  return x
})

// this is a way to hook into the Stream constructor call
Object.defineProperty(Stream.prototype, '_prod', {
  set<T>(producer: InternalProducer<T> | typeof NO) {
    this.__prod = producer
    patch(this)
  },
  get<T>() {
    return this.__prod as InternalProducer<T>
  },
})

function patch(stream: Stream<any>): void {
  let frame = captureFrame()
  if (!frame.parent) {
    return
  }

  let unmountPrevious = () => {}

  let _n = stream._n.bind(stream)
  let _c = stream._c.bind(stream)
  let _e = stream._e.bind(stream)

  if ((stream._prod as any).f) {
    const f = (stream._prod as any).f.bind(stream._prod)
    ;(stream._prod as any).f = (...args) => {
      unmountPrevious()
      return withFrame(frame, () => {
        const result = withUnmount(() => f(...args))
        unmountPrevious = result[0]
        return result[1]
      })
    }
  }

  Object.assign(stream, {
    _e(e) {
      unmountPrevious()
      withFrame(frame, () => {
        ;[unmountPrevious] = withUnmount(() => _e(e))
      })
    },
    _c() {
      unmountPrevious()
      withFrame(frame, () => {
        ;[unmountPrevious] = withUnmount(() => _c())
      })
    },
    _n(v: any) {
      unmountPrevious()
      withFrame(frame, () => {
        ;[unmountPrevious] = withUnmount(() => _n(v))
      })
    },
  })
}
