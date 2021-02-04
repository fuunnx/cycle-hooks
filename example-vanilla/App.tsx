import xs, { Stream } from 'xstream'
import { AnySinks, AnySources, createElement } from '../src'
import { Input } from './Input'
import { Incrementer } from './Incrementer'
import { Timer } from './Timer'
import { Request } from './Request'
import { withHTTPCache } from './hooks/useRequest'
import { div, h, h1, h2, header, MainDOMSource, section } from '@cycle/dom'
import { AppSinks, AppSources, AppState } from '.'
import { autorun } from './libs/autorun'
import { Atom } from './libs/Atom'
import { ButtonTest } from './ButtonTest'
import { mergeSinks } from 'cyclejs-utils'
import { createSelector } from './libs/createSelector'

type AnyRecord = Record<string, any>

function arrayify<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x]
}

function makeTogglable<
  Props extends AnyRecord,
  So extends { DOM: MainDOMSource; createID: () => string },
  Si extends AnySinks & { DOM: Stream<any> }
>(Component: (sources: So, props$?: Stream<Props>) => Si) {
  return function (sources: So, props$: Stream<Props & { title: string }>): Si {
    const component = Component(sources, props$)

    return {
      ...component,
      DOM: Togglable(
        sources,
        xs.combine(props$, component.DOM).map(([props, children]) => {
          return { title: props.title, children: arrayify(children) }
        }),
      ).DOM,
    } as Si
  }
}

function withRequestsCount(func: (sources: AppSources) => AppSinks) {
  return function (sources: AppSources): AppSinks {
    const sinks = func(sources)

    const updateCount$ = sinks.HTTP.mapTo((state) => ({
      ...state,
      requestsCount: (state.count || 0) + 1,
    }))

    return mergeSinks([sinks, { state: updateCount$ }])
  }
}

export const App = withRequestsCount(
  withHTTPCache(function App(sources) {
    const state = Atom<AppState>(sources)
    const valueAtom = state.lens<string>('value')

    const input1 = Input(sources, xs.of({ state: valueAtom }))

    const globalState = sources.state
    const serializedToggle = Togglable(
      sources,
      globalState.stream.map((state) => ({
        title: 'Serialized global state',
        children: [CodePreview({ state: state })],
      })),
    )

    function Incrementers(sources: AppSources) {
      return {
        DOM: xs.combine(
          ...Array.from(Array(3)).map(
            () =>
              Incrementer(sources, xs.of({ value$: xs.periodic(1000) })).DOM,
          ),
        ),
      }
    }
    const incrementersToggle = makeTogglable(Incrementers)(
      sources,
      xs.of({
        title: 'Incrementers',
      }),
    )

    const inputToggle = makeTogglable(Input)(
      sources,
      xs.of({ state: valueAtom, title: 'Input' }),
    )

    const timerToggle = makeTogglable(Timer)(
      sources,
      xs.of({
        title: 'Timer',
      }),
    )

    const requestToggle = makeTogglable(Request)(
      sources,
      state.stream.map((x) => ({ userId: x.value, title: 'Request' })),
    )

    const buttonsToggle = makeTogglable(ButtonTest)(
      sources,
      xs.of({ title: 'Buttons patterns' }),
    )

    return mergeSinks(
      [
        input1,
        serializedToggle,
        incrementersToggle,
        inputToggle,
        timerToggle,
        requestToggle,
        buttonsToggle,
      ],
      {
        DOM: () =>
          autorun((ex) => {
            return div([
              h1('Examples'),
              ex(input1.DOM),
              ex(serializedToggle.DOM),
              ex(incrementersToggle.DOM),
              ex(inputToggle.DOM),
              ex(timerToggle.DOM),
              ex(requestToggle.DOM),
              ex(buttonsToggle.DOM),
            ])
          }) as Stream<any>,
      },
    )
  }),
)

function CodePreview(props: { state: any }) {
  return <code>{JSON.stringify(props.state, null, '  ')}</code>
}

type TogglableProps = {
  title: string
  children?: JSX.Element[]
}
const Togglable = function Togglable(
  sources: { DOM: MainDOMSource; createID: () => string },
  props$: Stream<TogglableProps>,
) {
  const [headerSel, headerDom] = createSelector(sources)
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
