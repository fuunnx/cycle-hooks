import { mockTimeSource } from '@cycle/time'
import xs, { Stream } from 'xstream'
import { createElement } from '../pragma'
import { mountInstances } from './mountInstances'
import { onUnmount } from './unmount'
import { assertDomEqual } from '../libs/assertDomEqual'
import { useSourcesSymbol } from '../hooks/sources'
import { withHandler } from 'performative-ts'
import dropRepeats from 'xstream/extra/dropRepeats'
import { streamify } from '../libs/isObservable'

// wtf, if not used, the import is dropped
console.log(createElement)

function testCase(func) {
  return withHandler([useSourcesSymbol, () => ({})], () =>
    mountInstances(func()),
  )
}

test('pragma + mountInstances handles simple components', (done) => {
  const Time = mockTimeSource()

  function Component() {
    return Time.diagram('x').map(() => <div>Hello</div>)
  }

  assertDomEqual(
    Time,

    testCase(() =>
      Time.diagram('x').map(() => (
        <div>
          <Component />
        </div>
      )),
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

  Time.assertEqual(
    testCase(() => <ComponentA />),
    Time.diagram('1-1-2-2-3'),
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

  Time.assertEqual(
    testCase(() => <ComponentA />),
    Time.diagram('1-2-3x'),
  )

  Time.run(done)
})

test('starts receiving DOM updates on insert', (done) => {
  const Time = mockTimeSource()

  function ComponentA() {
    const visible$ = Time.diagram('0--1-')
    return visible$
      .map(Number)
      .map((visible) => (visible ? <ComponentB /> : 'x'))
  }

  function ComponentB() {
    const timer$ = Time.diagram('---123456')
    return timer$
  }

  Time.assertEqual(
    testCase(() => Time.diagram('x').map(() => <ComponentA />)),
    Time.diagram('x--123456'),
  )

  Time.run(done)
})

test('call unmount on remove (simple)', (done) => {
  const Time = mockTimeSource()

  let AmountedTimes = 0
  let AunmountedTimes = 0
  function ComponentA() {
    AmountedTimes++
    onUnmount(() => {
      AunmountedTimes++
    })

    return Time.diagram('x')
  }

  Time.assertEqual(
    testCase(() => xs.fromArray([<ComponentA />, null])),
    Time.diagram('x'),
  )

  Time.run(() => {
    expect(AmountedTimes).toEqual(1)
    expect(AunmountedTimes).toEqual(1)

    done()
  })
})

test('call unmount on remove (complex)', (done) => {
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

  Time.assertEqual(
    testCase(() =>
      Time.diagram('1-0-1-0-1-|').map((visible) =>
        visible ? <ComponentA /> : '',
      ),
    ),

    Time.diagram('1x'),
  )

  Time.run(() => {
    expect(AmountedTimes).toEqual(3)
    // TODO results are not coherent
    // expect(AunmountedTimes).toEqual(3)

    expect(BunmountedTimes).toEqual(BmountedTimes)

    done()
  })
})

test("don't call unmount on update", (done) => {
  const Time = mockTimeSource()

  function ComponentA() {
    const rerender$ = Time.diagram('1111')
    return rerender$.map(() => <ComponentB />)
  }

  let unmounted = 0
  function ComponentB() {
    const timer$ = Time.diagram('123456789')

    onUnmount(() => {
      unmounted++
    })
    return timer$
  }

  Time.assertEqual(
    testCase(() => <ComponentA />),
    ComponentB(),
  )

  Time.run(() => {
    expect(unmounted).toEqual(0)
    done()
  })
})

test('mounts children components', (done) => {
  const Time = mockTimeSource()

  function Parent(
    props$: { children: JSX.Element } | Stream<{ children: JSX.Element }>,
  ) {
    return streamify(props$).map((props) => props.children)
  }

  function Child() {
    return Time.diagram('x').map(() => <p>x</p>)
  }

  Time.assertEqual(
    testCase(() => (
      <Parent>
        <Child />
      </Parent>
    )),
    Child().map((x) => [x]),
  )

  Time.run(done)
})
