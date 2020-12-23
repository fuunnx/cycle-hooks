import { MockTimeSource } from '@cycle/time'
import { Stream } from 'xstream'
import toHTML from 'snabbdom-to-html'
import prettify from 'html-prettify'

export function assertDomEqual(
  Time: MockTimeSource,
  actual$: Stream<any>,
  expected$: Stream<any>,
) {
  Time.assertEqual(
    actual$.map(toHTML).map(prettify) as any,
    expected$.map(toHTML).map(prettify) as any,
  )
}
