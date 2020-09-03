import { mockTimeSource, MockTimeSource } from '@cycle/time'
import { h } from '@cycle/dom'
import { createElement, trackChildren } from './index'
import xs, { Stream } from 'xstream'
import toHTML from 'snabbdom-to-html'
import prettify from 'html-prettify'
import { onUnmount } from '../context/unmount'

// wtf or else the import is dropped
console.log({ createElement })

function assertDomEqual(
  Time: MockTimeSource,
  actual$: Stream<any>,
  expected$: Stream<any>,
) {
  Time.assertEqual(
    actual$.map(toHTML).map(prettify),
    expected$.map(toHTML).map(prettify),
  )
}

test('pragma works like h() for simple tags', (done) => {
  const Time = mockTimeSource()

  assertDomEqual(Time, xs.of(<div>coucou</div>), xs.of(h('div', ['coucou'])))
  assertDomEqual(
    Time,
    xs.of(<input type="text" value="coucou" />),
    xs.of(h('input', { props: { type: 'text', value: 'coucou' } }, [])),
  )

  Time.run(done)
})

test('pragma unwraps child streams', (done) => {
  const Time = mockTimeSource()

  const childA$ = Time.diagram('a--A--a')
  const childB$ = Time.diagram('b-B----')
  assertDomEqual(
    Time,
    trackChildren(
      <div>
        {childA$}
        <h1>{childB$}</h1>
      </div>,
    ),
    xs
      .combine(childA$, childB$)
      .map(([childA, childB]) => h('div', [childA, h('h1', childB)])),
  )

  Time.run(done)
})

test('pragma unwraps arbitrary nested child streams', (done) => {
  const Time = mockTimeSource()

  const childA$ = Time.diagram('a--A--a').map(xs.of).map(xs.of)
  assertDomEqual(
    Time,
    trackChildren(<div>{childA$}</div>),
    childA$
      .flatten()
      .flatten()
      .map((childA) => h('div', [childA])),
  )

  Time.run(done)
})

test('pragma unwraps props', (done) => {
  const Time = mockTimeSource()

  const value$ = Time.diagram('a--A--a').map(xs.of).map(xs.of)
  assertDomEqual(
    Time,
    value$
      .flatten()
      .flatten()
      .map((value) => h('input', { props: { type: 'text', value } }, [])),
    trackChildren(<input type="text" value={value$} />),
  )

  Time.run(done)
})

test('pragma handles simple components', (done) => {
  const Time = mockTimeSource()

  function Component() {
    return xs.of(<div>Hello</div>)
  }

  assertDomEqual(Time, trackChildren(<Component />), Component())

  Time.run(done)
})

test('keeps dynamic components alive until unmount', (done) => {
  const Time = mockTimeSource()

  function ComponentA() {
    const rerender$ = Time.diagram('1-1---1--')
    onUnmount(() => console.log('unmount A'))
    return rerender$.map(() => <ComponentB />)
  }

  function ComponentB() {
    const timer$ = Time.diagram('1---2---3')

    onUnmount(() => console.log('unmount B'))
    return timer$
  }

  const rerender$ = Time.diagram('1-1---1--')
  const timer$ = Time.diagram('1---2---3')

  Time.assertEqual(
    trackChildren(<ComponentA />),
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

  Time.assertEqual(trackChildren(<ComponentA />), Time.diagram('1-2-3x'))

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
    trackChildren(<ComponentA />),
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

  Time.assertEqual(trackChildren(<ComponentA />), Time.diagram('123x'))
  Time.assertEqual(
    trackChildren(
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

  Time.assertEqual(trackChildren(<ComponentA />), ComponentB())

  Time.run(() => {
    expect(unmounted).toEqual(0)
    done()
  })
})
