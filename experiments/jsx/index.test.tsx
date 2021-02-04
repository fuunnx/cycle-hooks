import { mockTimeSource } from '@cycle/time'
import { h } from '@cycle/dom'
import { createElement } from './index'
import xs from 'xstream'
import { assertDomEqual } from './libs/assertDomEqual'

// wtf or else the import is dropped
console.log({ createElement })

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
