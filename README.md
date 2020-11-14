(library not yet released, still in alpha)

# Cycle hooks

This is a BYOF (Bring Your Own Framework) extension to cyclejs

Constituted of a set of experimental utilities revolving around the implementation of a scoped ambiant context and other niceties

## Setup

```
yarn add cycle-hooks
```

```
npm install cycle-hooks --save
```

### Setup your App :

Wrap your toplevel component with `withHooks(App, Object.keys(drivers))`

```js
import { withHooks } from 'cycle-hooks'
import { run } from '@cycle/run'
import { App } from './App.js'

const drivers = {
  // your drivers
}

run(withHooks(App, Object.keys(drivers)), drivers)
```

### Replace your h function or use custom JSX pragma

TODO

### Write your first component

```tsx
function Timer() {
  const [count$, add] = useSubject()

  return {
    DOM: count$.map((count) => (
      <div>
        Count :{count}
        <button onClick={add}>Reset</button>
      </div>
    )),
  }
}
```

## Recipes

### Creating a hook

Well, that's DOM-less Cycle component.

But thanks to the context API it's not necessary to pass sinks and sinks all the way. You can focus on your API. `useSources`, `registerSinks` and `makeSubject` are your friends here.

### Testing

If you want to test a component using this API, all you have to do is wrap it :

```js
const sinks = withHooks(Component)(sources)
```

You can simulate 'effects' by providing a custom effects source:

// For now each `Subject` is generating an unique symbol, which is impossible to simulate

```js
const sinks = withHooks(Component)({ effects: xs.of(['effectKey', effectValue']) });
```

// Is this relevant ? those parts are mostly implementation details in components
Then read them in the sinks

```js
Time.assertEqual(sinks.effects.mapTo('x')), Time.diagram('--x--x--x'));
```

### Changing a child's sources

```js
function App(sources) {
  const Child_ = (args) => withSources({...sources, value: xs.of('Hello')}, () => Child(args))

  return (
    <Child_>
  )
}
```

### Changing a child's sinks

// Wellllllllllll could be better ?

```js
function App(sources) {
  const [childSinks, Child_] = gatherSinks(() => {
    const gatherer = useContext(gathererKey)
    return (props) => withContext(gathererKey, gatherer, () => Child(props))
  })

  registerSinks({
    ...childSinks,
    HTTP: xs.never(),
  })

  return (
    <Child_>
  )
}
```

## Related work

- cyrenajs
- cycle-next
- recksjs
- vue 3 composition api
- react hooks
