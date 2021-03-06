import { button } from '@cycle/dom'
import xs, { Stream } from 'xstream'
import { createElement } from '../../src'
import { useRef } from '../src/jsx/ref'
import { collectEffects, performEffects } from '../../src/effects/sinks'
import { useSources, withSources } from '../../src/effects/sources'

type Props = {}

export function ButtonTest(_: Props) {
  const [sinks, Button] = makeButton()
  const [sinks2, Button2Node] = collectEffects(['click$'], () => {
    return <Button2 />
  })

  console.log(Button2Node)
  return {
    DOM: xs
      .combine(
        sinks.click$.fold((count) => count + 1, 0),
        sinks2.click$.fold((count) => count + 1, 0),
      )
      .map(([count1, count2]) => {
        return (
          <div>
            <Button label={String(count1)} />
            <Button label={String(count1)} />
            {Button2Node}
            {count2}
          </div>
        )
      })
      .debug('out'),
  }
}

function makeButton() {
  const ref = useRef()
  const click$ = ref.DOM.events('click')

  return [
    { click$ },
    function Button(props: { label: string }) {
      return <button ref={ref}>{props.label}</button>
    },
  ] as const
}

type Button2Props = {
  label: string
}

function Button2() {
  const props$ = useProps$<Button2Props>()
  const click$ = useSources().DOM.events('click')

  performEffects({
    click$,
  })

  return props$
    .startWith({ label: '' })
    .map((props) => <button>{props.label}</button>)
}
