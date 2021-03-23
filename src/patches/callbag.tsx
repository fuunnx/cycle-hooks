import { captureFrame, withFrame } from 'performative-ts'
import { withUnmount } from '../effects/unmount'
import { Operator } from '@cycle/callbags'

type MakeOperator<Args extends any[], A, B> = (...args: Args) => Operator<A, B>
export function wrapOperator<
  MakeOp extends MakeOperator<unknown[], unknown, unknown>
>(operator: MakeOp): MakeOp {
  return function wrappedOperator(...args) {
    const frame = captureFrame()
    const op = operator(...args)

    return (source) => {
      return op(function src(type, d) {
        let unmountPrevious
        source(type, (...args) => {
          unmountPrevious?.()
          withFrame(frame, () => {
            ;[unmountPrevious] = withUnmount(() => d(...args))
          })
        })
      })
    }
  } as MakeOp
}
