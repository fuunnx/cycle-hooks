import xs from 'xstream'
import { useState } from '../src/hooks/state'
import { createElement } from '../src'
import { useSources } from '../src/hooks'
import { Input } from './Input'
import { Incrementer } from './Incrementer'
import { Timer } from './Timer'
import { JSX } from '../src/pragma/types'
import { useProps } from '../src/hooks/props'

export function App() {
  const state$ = useSources().state.stream

  return {
    DOM: state$.startWith(undefined).map((state: any) => (
      <div>
        <h1>Examples</h1>
        <Togglable title="Serialized global state">
          <code>{JSON.stringify(state, null, '  ')}</code>
        </Togglable>
        <Togglable title="Incrementer">
          <Incrementer value$={xs.periodic(1000)} />
          <Incrementer value$={xs.periodic(1000)} />
          <Incrementer value$={xs.periodic(1000)} />
        </Togglable>
        <Togglable title="Input">
          <Input />
        </Togglable>
        <Togglable title="Timer">
          <Timer />
        </Togglable>
      </div>
    )),
  }
}

type Props = {
  title: string
  children?: JSX.Element | JSX.Element[]
}
const Togglable = function Togglable(_: Props) {
  const [open$, setOpen] = useState(false)
  const props$ = useProps<Props>()

  return {
    DOM: xs.combine(open$, props$).map(([open, props]) => (
      <section className="togglable-section" class={{ '-open': open }}>
        <header
          className="header"
          tabIndex={0}
          attrs={{ 'aria-role': 'button' }}
          onClick={() => setOpen((x) => !x)}
        >
          <h2>{props.title}</h2>
        </header>
        {open && <content className="content">{props.children}</content>}
      </section>
    )),
  }
}
