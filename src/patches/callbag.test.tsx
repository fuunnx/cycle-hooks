import { subscribe } from '@cycle/callbags'
import { pipe, interval, map, filter, take } from 'callbag-basics'
import delay from 'callbag-delay'
import { withHandler, perform } from 'performative-ts'
import { onUnmount } from '../effects/unmount'
import { wrapOperator } from './callbag'

test('keeps a reference to the creation frame', (done) => {
  const chain = withHandler({ test: () => 'firstHandler' }, () => {
    return pipe(
      interval(10),
      delay(10),
      wrapOperator(map)((x: number) => {
        expect(perform('test')).toEqual('firstHandler')
        return x + 1
      }),
      wrapOperator(filter)((x) => {
        expect(perform('test')).toEqual('firstHandler')
        return Boolean(x % 2)
      }),
      take(5),
    )
  })

  withHandler({ test: () => 'secondHandler' }, () => {
    pipe(
      chain,
      wrapOperator(map)((x) => {
        expect(perform('test')).toEqual('secondHandler')
        return x + 1
      }),
      take(2),
      subscribe(
        () => {
          expect(perform('test')).toEqual('secondHandler')
        },
        () => {
          done()
        },
      ),
    )
  })
})

test('triggers "unmount" on next', (done) => {
  let calledTimes = 0
  pipe(
    interval(10),
    take(2),
    wrapOperator(map)(() => {
      onUnmount(() => {
        calledTimes++
      })
    }),
    subscribe(
      () => {},
      () => {
        expect(calledTimes).toEqual(2)
        done()
      },
    ),
  )
})
