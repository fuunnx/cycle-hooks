import { Stream, InternalProducer, NO } from 'xstream'
import { useFrame, safeUseContext, withFrame } from '../context'
import { gathererKey } from '../hooks/sinks'
import { Sinks } from '../types'
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
  let frame = useFrame()
  if (!frame.parent) {
    return
  }

  let unmountPrevious = () => {}
  const gatherer = safeUseContext(gathererKey)
  if (gatherer) {
    frame = frame.forkWith({
      [gathererKey as symbol]: (sinks: Sinks) => {
        gatherer(sinks)
      },
    })
  }

  let _n = withFrame(frame, stream._n.bind(stream))
  let _c = withFrame(frame, stream._c.bind(stream))
  let _e = withFrame(frame, stream._e.bind(stream))

  Object.assign(stream, {
    _e(e) {
      unmountPrevious()
      ;[unmountPrevious] = withUnmount(() => _e(e))
    },
    _c() {
      unmountPrevious()
      ;[unmountPrevious] = withUnmount(() => _c())
    },
    _n(v: any) {
      unmountPrevious()
      ;[unmountPrevious] = withUnmount(() => _n(v))
    },
  })
}
