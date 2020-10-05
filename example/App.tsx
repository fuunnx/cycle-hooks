import xs from 'xstream'
import { useState } from '../lib/hooks/useState'
import { createElement } from '../lib'
import { useSources } from '../lib/hooks'
import { Input } from './Input'
import { Incrementer } from './Incrementer'
import { Timer } from './Timer'
import { define } from '../lib/pragma/define'
import { JSX } from '../lib/pragma/types'

export function App() {
  const state$ = useSources().state.stream

  return state$.startWith(undefined).map((state: any) => (
    <div>
      <h1>Examples</h1>
      <Togglable title="Serialized global state">
        <code>{JSON.stringify(state, null, '  ')}</code>
      </Togglable>
      <Togglable title="Incrementer">
        <Incrementer value={xs.periodic(1000)} />
        <Incrementer key="hello" value={xs.periodic(1000)} />
        <Incrementer key="hello" value={xs.periodic(1000)} />
      </Togglable>
      <Togglable title="Input">
        <Input />
      </Togglable>
      <Togglable title="Timer">
        <Timer />
      </Togglable>
    </div>
  ))
}

type Props = {
  title: string
  children?: JSX.Element | JSX.Element[]
}
const Togglable = define<Props>(function Togglable({ props$ }) {
  const [open$, setOpen] = useState(false)

  return xs.combine(open$, props$).map(([open, props]) => (
    <section className="togglable-section" class={{ '-open': open }}>
      <header
        className="header"
        tabIndex={0}
        attrs={{ 'aria-role': 'button' }}
        on={{
          click: () => setOpen((x) => !x),
        }}
      >
        <h2>{props.title}</h2>
      </header>
      {open && <content className="content">{props.children}</content>}
    </section>
  ))
})
