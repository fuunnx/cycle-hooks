import xs, { Stream } from 'xstream'
import { createElement } from '../src'
import { useSources } from '../src/effects/sources'
import { Input } from './Input'
import { Incrementer } from './Incrementer'
import { Timer } from './Timer'
import { Request } from './Request'
import { withHTTPCache } from './hooks/useRequest'
import { div, h1 } from '@cycle/dom'
import { isolate } from '../src/withEffects/isolate'
import { useAppSources } from '.'

export const App = withHTTPCache(function App() {
  const { state } = useAppSources()
  const state$ = state.stream.startWith({ value: '' })
  const input1 = isolate(Input)()
  const serializedToggle = isolate(Togglable)(
    state$.map((state) => ({
      title: 'Serialized global state',
      children: CodePreview({ state: state }),
    })),
  )

  const incrementers = Array(3).map(() =>
    isolate(Incrementer)(xs.of({ value$: xs.periodic(1000) })),
  )
  const incrementersToggle = isolate(Togglable)(
    xs.combine(...incrementers.map((x) => x.DOM)).map((children) => ({
      title: 'Incrementers',
      children,
    })),
  )

  return {
    DOM: xs
      .combine(input1.DOM, serializedToggle.DOM, incrementersToggle.DOM)
      .map(([Input1, SerializedToggle, IncrementersToggle]) => {
        return div([
          h1('Examples'),
          Input1,
          SerializedToggle,
          IncrementersToggle,
        ])
        // (
        //   <div>
        //     <Togglable title="Incrementer">
        //       <Incrementer value$={xs.periodic(1000)} />
        //       <Incrementer value$={xs.periodic(1000)} />
        //       <Incrementer value$={xs.periodic(1000)} />
        //     </Togglable>
        //     <Togglable title="Input">
        //       <Input />
        //     </Togglable>
        //     <Togglable title="Timer">
        //       <Timer />
        //     </Togglable>
        //     <Togglable title="Request">
        //       <Request userId={state?.value} />
        //     </Togglable>
        //     <Togglable title="Button">
        //       <ButtonTest />
        //     </Togglable>
        //   </div>
        // )
      }),
  }
})

function CodePreview(props: { state: any }) {
  return <code>{JSON.stringify(props.state, null, '  ')}</code>
}

type TogglableProps = {
  title: string
  children?: JSX.Element | JSX.Element[]
}
const Togglable = function Togglable(props$: Stream<TogglableProps>) {
  const { DOM } = useAppSources()
  const open$ = DOM.select('.header')
    .events('click')
    .fold((isOpen) => !isOpen, false)

  return {
    DOM: xs.combine(open$, props$).map(([open, props]) => (
      <section className="togglable-section" class={{ '-open': open }}>
        <header
          className="header"
          tabIndex={0}
          attrs={{ 'aria-role': 'button' }}
        >
          <h2>{props.title}</h2>
        </header>
        {open && <content className="content">{props.children}</content>}
      </section>
    )),
  }
}
