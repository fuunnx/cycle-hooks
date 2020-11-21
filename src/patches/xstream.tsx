import { Stream, InternalProducer, NO } from 'xstream'
import { captureFrame, withFrame } from 'performative-ts'
import { withUnmount } from '../hooks/unmount'

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
