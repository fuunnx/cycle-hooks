import { mockTimeSource } from '@cycle/time'
import { assertDomEqual } from './assertDomEqual'
import { unwrapVtree$ } from './unwrapVtree$'
import { createElement } from '..'
import xs from 'xstream'
import { h } from '@cycle/dom'

console.log(createElement)

test('unwrapVtree$ unwraps child streams', (done) => {
  const Time = mockTimeSource()

  const childA$ = Time.diagram('a--A--a')
  const childB$ = Time.diagram('b-B----')
  assertDomEqual(
    Time,
    unwrapVtree$(
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

test('unwrapVtree$ unwraps arbitrary nested child streams', (done) => {
  const Time = mockTimeSource()

  const childA$ = Time.diagram('a--A--a').map(xs.of).map(xs.of)
  assertDomEqual(
    Time,
    unwrapVtree$(<div>{childA$}</div>),
    childA$
      .flatten()
      .flatten()
      .map((childA) => h('div', [childA])),
  )

  Time.run(done)
})

test('unwrapVtree$ unwraps props', (done) => {
  const Time = mockTimeSource()

  const value$ = Time.diagram('a--A--a').map(xs.of).map(xs.of)
  assertDomEqual(
    Time,
    value$
      .flatten()
      .flatten()
      .map((value) => h('input', { props: { type: 'text', value } }, [])),
    unwrapVtree$(<input type="text" value={value$} />),
  )

  Time.run(done)
})
