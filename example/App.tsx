import xs from 'xstream'
import { useState } from './hooks/state'
import { createElement, Sinks, Sources } from '../src'
import { useSources } from '../src/hooks/sources'
import { Input } from './Input'
import { Incrementer } from './Incrementer'
import { Timer } from './Timer'
import { Request } from './Request'
import { useProps$ } from '../src/hooks/props'
import { StateSource } from '@cycle/state'
import { HandlerFunction, HandlerTuple, withHandler } from 'performative-ts'
import { withHTTPCache } from './hooks/useRequest'

type AppSources = {
  state: StateSource<{ value?: number }>
}

export function App() {
  const state$ = useSources<AppSources>().state.stream

  // // needs exploration
  // // if sources are only streams, then plugins could just be cycle "hooks"
  // // and it would be easy to wrap the sources stream
  // const Request_ = bindHandler(
  //   [
  //     readSourcesEffect,
  //     () => {
  //       const sources = useSources()
  //       return {
  //         ...sources,
  //         HTTP: '',
  //       }
  //     },
  //   ],
  //   Request,
  // )

  return withHTTPCache(() => {
    return state$.startWith(undefined).map((state: any) => {
      return (
        <div>
          <h1>Examples</h1>
          <Input />
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
          <Togglable title="Request">
            <Request userId={state?.value} />
          </Togglable>
        </div>
      )
    })
  })
}

type WrapProps<T extends HandlerFunction> = {
  handler: HandlerTuple<T>
  children: () => any
}

function WithHandler<T extends HandlerFunction>(_: WrapProps<T>) {
  const props$ = useProps$<WrapProps<T>>()

  return props$
    .debug('props')
    .map((x) => {
      try {
        console.log(x.children)
        return (withHandler as any)(x.handler, () => x.children[0]?.())
      } catch (e) {
        console.error(e)
      }
    })
    .debug('children')
}

type TogglableProps = {
  title: string
  children?: JSX.Element | JSX.Element[]
}
const Togglable = function Togglable(_: TogglableProps) {
  const [open$, setOpen] = useState(false)
  // here useSources() and useProps$() are an APi problem : if someone wants to use hooks without pragma, a lot of things would work differently
  const props$ = useProps$<TogglableProps>()

  return xs.combine(open$, props$).map(([open, props]) => (
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
  ))
}
