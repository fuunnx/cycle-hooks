import { mockTimeSource } from '@cycle/time'
import xs from 'xstream'
import { createElement } from '../pragma'
import { mountInstances as mountInstances_ } from './mountInstances'
import { onUnmount } from '../hooks/unmount'
import { assertDomEqual } from '../helpers/assertDomEqual'
import { readSourcesEffect } from '../hooks/sources'
import { bindHandler } from 'performative-ts'

const mountInstances = bindHandler(
  [readSourcesEffect, () => ({})],
  mountInstances_,
)

// wtf, if not used, the import is dropped
console.log(createElement)

test('pragma + mountInstances handles simple components', (done) => {
  const Time = mockTimeSource()

  function Component() {
    return xs.of(<div>Hello</div>)
  }

  assertDomEqual(
    Time,

    mountInstances(
      <div>
        <Component />
      </div>,
    ),

    Component().map((x) => <div>{x}</div>),
  )

  Time.run(done)
})

test('keeps dynamic components alive until unmount', (done) => {
  const Time = mockTimeSource()

  function ComponentA() {
    const rerender$ = Time.diagram('1-1---1--')
    return rerender$.map(() => <ComponentB />)
  }

  function ComponentB() {
    const timer$ = Time.diagram('1---2---3')
    return timer$
  }

  const rerender$ = Time.diagram('1-1---1--')
  const timer$ = Time.diagram('1---2---3')

  Time.assertEqual(
    mountInstances(<ComponentA />),
    xs.combine(rerender$, timer$).map(([, timer]) => timer),
  )

  Time.run(done)
})

test('stop receiving DOM updates on remove', (done) => {
  const Time = mockTimeSource()

  function ComponentA() {
    const visible$ = Time.diagram('1----0-')
    return visible$.map((visible) => (visible ? <ComponentB /> : 'x'))
  }

  function ComponentB() {
    const timer$ = Time.diagram('1-2-3-4-5')
    return timer$
  }

  Time.assertEqual(mountInstances(<ComponentA />), Time.diagram('1-2-3x'))

  Time.run(done)
})

test('start receiving DOM updates on insert', (done) => {
  const Time = mockTimeSource()

  function ComponentA() {
    const visible$ = Time.diagram('0--1-')
    return visible$.map((visible) => (visible ? <ComponentB /> : 'x'))
  }

  function ComponentB() {
    const timer$ = Time.diagram('123456')
    return timer$
  }

  Time.assertEqual(
    mountInstances(<ComponentA />),
    Time.diagram('0--1-')
      .map((visible) => (visible ? ComponentB() : xs.of('x')))
      .flatten(),
  )

  Time.run(done)
})

test('call unmount on remove', (done) => {
  const Time = mockTimeSource()

  let AmountedTimes = 0
  let AunmountedTimes = 0
  function ComponentA() {
    const visible$ = Time.diagram('1--1--0-')

    AmountedTimes++
    onUnmount(() => {
      AunmountedTimes++
    })

    return visible$.map((visible) => (visible ? <ComponentB /> : 'x'))
  }

  let BmountedTimes = 0
  let BunmountedTimes = 0
  function ComponentB() {
    const timer$ = Time.diagram('123456789')

    BmountedTimes++
    onUnmount(() => {
      BunmountedTimes++
    })
    return timer$
  }

  Time.assertEqual(mountInstances(<ComponentA />), Time.diagram('123x'))
  Time.assertEqual(
    mountInstances(
      Time.diagram('1-0-1-0-1|').map((visible) =>
        visible ? <ComponentA /> : '',
      ),
    ),

    Time.diagram('1x'),
  )

  Time.run(() => {
    expect(AmountedTimes).toEqual(4)
    expect(AunmountedTimes).toEqual(4)

    // TODO results are not coherent
    // expect(BunmountedTimes).toEqual(BmountedTimes); // ??? --> not removed on END

    done()
  })
})

test("don't call unmount on update", (done) => {
  const Time = mockTimeSource()

  function ComponentA() {
    const visible$ = Time.diagram('1111')
    return visible$.map((visible) => (visible ? <ComponentB /> : 'x'))
  }

  let unmounted = 0
  function ComponentB() {
    const timer$ = Time.diagram('123456789')

    onUnmount(() => {
      unmounted++
    })
    return timer$
  }

  Time.assertEqual(mountInstances(<ComponentA />), ComponentB())

  Time.run(() => {
    expect(unmounted).toEqual(0)
    done()
  })
})
