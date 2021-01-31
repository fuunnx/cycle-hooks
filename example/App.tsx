import xs, { Stream } from 'xstream'
import { AnySources, createElement } from '../src'
import { Input } from './Input'
import { Incrementer } from './Incrementer'
import { Timer } from './Timer'
import { Request } from './Request'
import { withHTTPCache } from './hooks/useRequest'
import { div, h, h1, h2, header, section } from '@cycle/dom'
import { useAppSources } from '.'
import { useSel } from '../src/effects/sel'
import { autorun } from './libs/autorun'

type AnyRecord = Record<string, any>

function arrayify<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x]
}

function makeTogglable<T extends AnyRecord, U>(
  Component: (props$?: Stream<T>) => AnySources & { DOM: Stream<any> },
) {
  return function (props$: Stream<T & { title: string }>) {
    const component = Component(props$)

    return {
      ...component,
      DOM: Togglable(
        xs.combine(props$, component.DOM).map(([props, children]) => {
          return { title: props.title, children: arrayify(children) }
        }),
      ).DOM,
    }
  }
}

export const App = withHTTPCache(function App() {
  const { state } = useAppSources()
  const state$ = state.stream.startWith({ value: '' })
  const input1 = Input()
  const serializedToggle = Togglable(
    state$.map((state) => ({
      title: 'Serialized global state',
      children: [CodePreview({ state: state })],
    })),
  )

  function Incrementers() {
    return {
      DOM: xs.combine(
        ...Array.from(Array(3)).map(
          () => Incrementer(xs.of({ value$: xs.periodic(1000) })).DOM,
        ),
      ),
    }
  }
  const incrementersToggle = makeTogglable(Incrementers)(
    xs.of({
      title: 'Incrementers',
    }),
  )

  const inputToggle = makeTogglable(Input)(
    xs.of({
      title: 'input',
    }),
  )

  const timerToggle = makeTogglable(Timer)(
    xs.of({
      title: 'Timer',
    }),
  )

  const requestToggle = makeTogglable(Request)(
    state.stream.map((x) => ({ userId: x.value, title: 'Request' })),
  )

  return {
    DOM: autorun((ex) => {
      return div([
        h1('Examples'),
        ex(input1.DOM),
        ex(serializedToggle.DOM),
        ex(incrementersToggle.DOM),
        ex(inputToggle.DOM),
        ex(timerToggle.DOM),
        ex(requestToggle.DOM),
      ])
    }),
  }
})

function CodePreview(props: { state: any }) {
  return <code>{JSON.stringify(props.state, null, '  ')}</code>
}

type TogglableProps = {
  title: string
  children?: JSX.Element[]
}
const Togglable = function Togglable(props$: Stream<TogglableProps>) {
  const [headerSel, headerDom] = useSel()
  const open$ = headerDom.events('click').fold((isOpen) => !isOpen, false)

  return {
    DOM: xs.combine(open$, props$).map(([open, props]) => {
      return section(
        {
          class: { 'togglable-section': true, '-open': open },
        },
        [
          header(
            headerSel,
            {
              class: { header: true },
              props: { tabIndex: 0 },
              attrs: { 'aria-role': 'button' },
            },
            [h2([props.title])],
          ),
          open
            ? h(
                'content',
                { class: { content: true } },
                props.children as any[],
              )
            : undefined,
        ],
      )
    }),
  }
}
