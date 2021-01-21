import { button } from '@cycle/dom'
import { createElement } from '../src'
import { useRef } from '../src/hooks/ref'

type Props = {}

export function ButtonTest(_: Props) {
  const [sinks, Button] = makeButton()

  return {
    DOM: sinks.click$
      .fold((count) => count + 1, 0)
      .map((count) => {
        return (
          <div>
            <Button label={String(count)} />
            <Button label={String(count)} />
          </div>
        )
      }),
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
