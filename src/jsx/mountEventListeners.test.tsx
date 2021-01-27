import { mountEventListeners } from './mountEventListeners'

import { mockTimeSource, MockTimeSource } from '@cycle/time'
import sample from 'xstream-sample'
import { mockDOMSource, h } from '@cycle/dom'
import { createElement, AnySources } from '../index'
import xs from 'xstream'
import { withEffects } from '../withEffects'

function useSubject<T>() {
  const subject$ = xs.create<T>()
  return [
    subject$,
    function next(x: T): void {
      subject$.shamefullySendNext(x)
    },
  ] as const
}

// wtf, if not used, the import is dropped
console.log(createElement)

function testTime(impl: (Time: MockTimeSource) => void) {
  return function exec(done) {
    const Time = mockTimeSource()
    impl(Time)
    Time.run(done)
  }
}

function compareComponents(
  Time: MockTimeSource,
  sources: AnySources,
  [Actual, Expected],
) {
  const expectedSinks = Expected(sources)
  const actualSinks = Actual(sources)

  Object.keys(expectedSinks).forEach((key) => {
    Time.assertEqual(
      xs.merge(expectedSinks[key], xs.never()),
      xs.merge(actualSinks[key], xs.never()),
    )
  })
}

test(
  'mounts listeners on simple DOM element',
  testTime((Time) => {
    function Expected(sources: AnySources) {
      return {
        DOM: xs.of(
          <div>
            {h('button', { attrs: { ['l-button-0-0']: true }, props: {} }, [])}
          </div>,
        ),
        click$: sources.DOM.select('[l-button-0-0]').events('click').mapTo('x'),
      }
    }

    const Actual = withEffects(function Sugar() {
      const [click$, onClick] = useSubject()
      return {
        DOM: xs
          .of(
            <div>
              <button onClick={onClick} />
            </div>,
          )
          .compose(mountEventListeners),
        click$: click$.mapTo('x'),
      }
    })

    compareComponents(
      Time,
      {
        DOM: mockDOMSource({
          '[l-button-0-0]': {
            click: Time.diagram('--x--x--|'),
          },
        }),
      },
      [Actual, Expected],
    )
  }),
)

test(
  'has nice selectors',
  testTime((Time) => {
    function Expected(sources: AnySources) {
      return {
        DOM: xs.of(
          <div>
            <button id="clickMe" />
            {h(
              'button',
              {
                key: 'clickKey',
                attrs: { ['l-key-clickKey']: true },
                props: { key: 'clickKey' },
              },
              [],
            )}
          </div>,
        ),
        click1$: sources.DOM.select('#clickMe').events('click').mapTo('x'),
        click2$: sources.DOM.select('[l-key-clickKey]')
          .events('click')
          .mapTo('x'),
      }
    }

    const Actual = withEffects(function Sugar() {
      const [click1$, onClick1] = useSubject()
      const [click2$, onClick2] = useSubject()
      return {
        DOM: xs
          .of(
            <div>
              <button id="clickMe" onClick={onClick1} />
              <button key="clickKey" onClick={onClick2} />
            </div>,
          )
          .compose(mountEventListeners),
        click1$: click1$.mapTo('x'),
        click2$: click2$.mapTo('x'),
      }
    })

    compareComponents(
      Time,
      {
        DOM: mockDOMSource({
          '#clickMe': {
            click: Time.diagram('--x--x--|'),
          },
          '[l-key-clickKey]': {
            click: Time.diagram('--x--x--|'),
          },
        }),
      },
      [Actual, Expected],
    )
  }),
)

test(
  'mounted listeners can be updated',
  testTime((Time) => {
    function Expected(sources: AnySources) {
      const count$ = Time.periodic(10).take(10).startWith(0)

      return {
        DOM: count$.mapTo(
          h('button', { attrs: { ['l-button-0']: true }, props: {} }, []),
        ),
        click$: sources.DOM.select('[l-button-0]')
          .events('click')
          .compose(sample(count$)),
      }
    }

    const Actual = withEffects(function Sugar() {
      const [click$, onClick] = useSubject()
      const count$ = Time.periodic(10).take(10).startWith(0)

      return {
        DOM: count$
          .map((count) => {
            return <button onClick={() => onClick(count)} />
          })
          .compose(mountEventListeners),
        click$: click$,
      }
    })

    compareComponents(
      Time,
      {
        DOM: mockDOMSource({
          '[l-button-0]': {
            click: Time.diagram('--x--x--|'),
          },
        }),
      },
      [Actual, Expected],
    )
  }),
)

test(
  'mounted listeners can be updated',
  testTime((Time) => {
    function Expected(sources: AnySources) {
      const count$ = Time.periodic(10).take(10).startWith(0)

      return {
        DOM: count$.map((count) => {
          if (count > 5) return
          return h('button', { attrs: { ['l-button-0']: true }, props: {} }, [])
        }),
        click$: sources.DOM.select('[l-button-0]')
          .events('click')
          .compose(sample(count$))
          .endWhen(count$.filter((x) => x > 5)),
      }
    }

    const Actual = withEffects(function Sugar() {
      const [click$, onClick] = useSubject()
      const count$ = Time.periodic(10).take(10).startWith(0)

      return {
        DOM: count$
          .map((count) => {
            if (count > 5) return
            return <button onClick={() => onClick(count)} />
          })
          .compose(mountEventListeners),
        click$: click$,
      }
    })

    compareComponents(
      Time,
      {
        DOM: mockDOMSource({
          '[l-button-0]': {
            click: Time.diagram('--x--x--|'),
          },
        }),
      },
      [Actual, Expected],
    )
  }),
)
