import xs, { Stream } from 'xstream'
import { useState } from '../lib/hooks/useState'
import { useSources, createElement } from '../lib'
import { Input } from './Input'
import { Incrementer } from './Incrementer'
import { Timer } from './Timer'
import { define } from '../lib/pragma/define'
import { JSX } from '../definitions'
import { VNode } from '@cycle/dom'

export function App() {
  const state$ = useSources().state.stream

  return (
    <div>
      <h1>Examples</h1>
      <Togglable title="Serialized global state">
        <code>
          {state$
            .startWith(undefined)
            .map((x) => JSON.stringify(x, null, '  '))}
        </code>
      </Togglable>
      <code>
        {/* {state$.startWith(undefined).map((x) => JSON.stringify(x, null, "  "))} */}
      </code>
      <Togglable title="Incrementer">
        <Incrementer value={xs.periodic(1000)} />
      </Togglable>
      <Togglable title="Input">
        <Input />
      </Togglable>
      <Togglable title="Timer">
        <Timer />
      </Togglable>
    </div>
  )
}

type Props = {
  title: string
}
const Togglable = define<Props>(function Togglable({ props$ }) {
  const [open$, setOpen] = useState(false)

  return open$.map((open) => (
    <section className="togglable-section" class={{ '-open': open }}>
      <header
        className="header"
        tabIndex={0}
        attrs={{ 'aria-role': 'button' }}
        on={{
          click: () => setOpen((x) => !x),
        }}
      >
        <h2>{props$.map((x) => x.title)}</h2>
      </header>
      {open && (
        <content className="content">{props$.map((x) => x.children)}</content>
      )}
    </section>
  ))
})
