# Ce que je veux obtenir :

Ça doit prendre la forme de sucre syntaxique

Tout ce qui est écrit doit pouvoir être remplacé avec un code tradi qui donne le même résultat

## Syntaxes composants

```tsx
type AppSources = {
  name: string
}

function App() {
  const sources = useSources<AppSources>()
  const [count$, setCount] = useState(0)

  return count$.map(count => {
    return (
      <div>
        <Component name="World" onClick={() => setCount((state) => state + 1)} />
        {count}
      </div>
    )
  })
}

type ComponentProps = {
  name: string
  onClick: (event: ClickEvent) => unknown
}

function Component(_: ComponentProps) {
  const sources = useSources<AppSources>()
  const props$ = useProps<ComponentProps>()

  registerSinks({
    otherSink: xs.of('thing')
  })

  return props$.map(props => {
    const { name, onClick } = props

    return <button onClick={onClick}>Hello {props.name}!</button>
  })
}

run(withHooks(App, ['DOM', 'otherSink'], drivers)
```

Revient à :

```tsx
type AppSources = {
  name: string
}

function App(sources: AppSources) {
  const component = Component({ ...sources, props: xs.of({ name: 'World' }) })
  const count$ = component.click$
    .map(() => (state) => state + 1)
    .fold((x) => x + 1, 0)

  return {
    otherSink: component.otherSink,
    DOM: xs.combine(count$, component.DOM).map([count, componentDOM] => {
      return (
        <div>
          {componentDOM}
          {count}
        </div>
      )
    })
  }
}

type ComponentSources = AppSources & {
  props$: Stream<{
    name: string
  }>
}

function Component(sources: ComponentSources) {
  const props$ = { sources }

  registerSinks({
    otherSink: xs.of('thing')
  })

  return {
    otherSink: xs.of('thing'),
    click$: DOM.select('[data-has-onClick]').events('click').map(e => e.target['props-map-onClick'](e)),
    DOM: props$.map(props => {
      const { name } = props

      return <button props-map-onClick={event => event}>Hello {props.name}!</button>
    })
  }
}

run(App, drivers)
```

## Syntaxe hooks

```js
function App() {
  const sources = useSources()
  const [sinks, result] = gatherSinks(() => provideSources(sources, () => Component())))

  return sinks
}

function Component() {
  const sources = useSources()

  registerSinks({
    other: //
  })

  return {
    DOM: //
  }
}

run(withHooks(App, ['DOM', 'other'], drivers)
```

Revient à écrire :

```js
function App(sources) {
  return Component(sources)
}

function Component(sources) {
  return {
    DOM: //
    other: //
  }
}

run(App, drivers)
```

Pour le coup la première version est vachement plus verbeuse, mais permettrait de brancher les composants via le DOM ou via des librairies ('use\*')

## Un bon typage

## Des erreurs immédiates au runtime dans le cas où ça ne peut pas être typé

# Ce que je laisse à d'autres helpers / librairies :

## Unwrap nested streams

## Autorun
