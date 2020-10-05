import { mountEventListeners } from './mountEventListeners'

import { mockTimeSource, MockTimeSource } from '@cycle/time'
import { h, mockDOMSource } from '@cycle/dom'
import { createElement, Sources } from '../index'
import xs from 'xstream'
import { assertDomEqual } from '../helpers/assertDomEqual'
import { provideSources, useSources } from '../hooks/sources'
import { useSubject } from '../helpers/subjects'
import { gatherSinks } from '../hooks/sinks'
import { withHooks } from '../wrapper'
import { Component } from './types'

// wtf or else the import is dropped
console.log({ createElement })

function testTime(impl: (Time: MockTimeSource) => void) {
  return function exec(done) {
    const Time = mockTimeSource()
    impl(Time)
    Time.run(done)
  }
}

function compareComponents(
  Time: MockTimeSource,
  sources: Sources,
  [Actual, Expected],
) {
  const expectedSinks = Expected(sources)
  const actualSinks = Actual(sources)

  Object.keys(expectedSinks).forEach((key) => {
    Time.assertEqual(
      xs.merge(actualSinks[key], xs.never()),
      xs.merge(expectedSinks[key], xs.never()),
    )
  })
}

test(
  'efzefgzg',
  testTime((Time) => {
    function Expected(sources: Sources) {
      return {
        DOM: xs.of(<button id="clickMe" />),
        click$: sources.DOM.select('#clickMe').events('click').mapTo('x'),
      }
    }

    const Actual = withHooks(function Sugar() {
      const [click$, onClick] = useSubject()
      return {
        DOM: xs
          .of(<button id="clickMe" onClick={onClick} />)
          .compose(mountEventListeners),
        click$: click$.mapTo('x'),
      }
    })

    const sources = {
      DOM: mockDOMSource({
        '#clickMe': {
          click: Time.diagram('--x--x--|'),
        },
      }),
    }

    // const expectedSinks = Expected(sources)
    // const actualSinks = Actual(sources)
    // Time.assertEqual(actualSinks.DOM, expectedSinks.DOM)
    // Time.assertEqual(
    //   xs.merge(actualSinks.click$, xs.never()),
    //   xs.merge(expectedSinks.click$, xs.never()),
    // )

    compareComponents(
      Time,
      {
        DOM: mockDOMSource({
          '#clickMe': {
            click: Time.diagram('--x--x--|'),
          },
        }),
      },
      [Actual, Expected],
    )
  }),
)
