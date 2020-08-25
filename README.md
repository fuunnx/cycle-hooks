(library not yet released, still in alpha)

# Cycle hooks

This is a set of experimental utilities revolving around the implementation of an ambiant context called. By bringing them together it creates new capabilities on top of the CycleJS framework.

## Setup

```
yarn add cycle-hooks
```

```
npm install cycle-hooks --save
```

### Setup your App :

1. Add eventListenersModule to the DOMDriver
2. Add effectsDriver to your drivers
3. Wrap your toplevel component with `withHooks(App, Object.keys(drivers))`
4. `run` it or use it like a regular Cycle application

```js
// 1
import { makeDOMDriver } from "@cycle/dom";
import modules from "@cycle/dom/lib/es6/modules";
import { eventListenersModule } from "snabbdom/build/package/modules/eventlisteners";
// 2 and 3
import { makeEffectsDriver, withHooks } from "cycle-hooks";

// 4
import { run } from "@cycle/run";
import { App } from "./App.js";

const drivers = {
  // 1
  DOM: makeDOMDriver("#app", {
    modules: [...modules, eventListenersModule],
  }),
  // 2
  effects: makeEffectsDriver(),
};

// 3
const RunnableApp = withHooks(App, Object.keys(drivers));

// 4
run(RunnableApp, drivers);
```

### Write your first component

```tsx
function Timer() {
  const [reset$, reset] = makeSubject();

  return (
    <div>
      Count :
      {reset$
        .startWith(null)
        .map(() => xs.periodic(500).startWith(0))
        .flatten()}
      <button on={{ click: reset }}>Reset</button>
    </div>
  );
}
```

### Install JSX

// Instructions

## Motivations

### Aim

An app developped with Cylejs has great characterics :

- testability thanks to : explicit dependency injection, declarative effects, and @cycle/time
- logability and control of effects, because every effect and event flows through the entire components hierarchy
- easy cancellation thanks to Observables

But with a few downsides :

- lots of verbosity
- painful DOM composition

Vue3 and React are great because :

- easy DOM composition
- easy hooks composition
- callback based event listeners

But with a few downsides :

- weird cancellation semantics
- sometimes obscure dataflow
- easier to loose testability

This lib aims to provide an ergonomic similar to ones in vue3/react hooks in cyclejs, without loosing Cyclejs strong selling points, and to lower the barrier of entry for new users.

### But isn't it impure ?

Yes and no

```js
// while this is impure
function HookComponent() {
  const category = new Symbol();

  registerSinks({
    HTTP: xs.of({
      method: "GET",
      url: "example.com",
      category,
    }),
  });

  return createElement("p", [
    "Hello",
    useSources().HTTP.select(category)
      .flatten()
      .startWith('(???)')
      .map(res.body.name))
  ])
}

// this is pure, interceptable and testable
const CycleComponent = withHooks(
  HookComponent,
  ['DOM', 'HTTP']
)

```

### But inn't Cyclejs current API enough ?

Yes, it's totally fine.

However for 80% of UI work, vue composition à la Reactjs is more ergonomic. For the other 20%, you can still fallback to the good old cyclejs API which really shines on advanced tasks (`DOM.events('eventname')`, DOMless components).

Also common questions are raised by the community :

- (quote here issue about HTTP requests (solved in cycle-next))
- (quote here issue about DOM composition (solved by cyrenajs))
- (quote here issue about onEvent listener)

## How ? And what's inside ?

### Hooks

This is the main piece. It provides an ambiant execution context, which is passed down the call stack and persisted between asychronous calls.

It permits to make localized dependency injection, without the boilerplate of passing sources through arguments, while keeping it's benefits.

It's the main mechanic behind `gatherSinks`, `useSources`, `makeSubject`, `useEffect`, the JSX pragma, etc.

### Effects driver

- Used to execute imperative code in sinks
- Used to be a traceable source of events coming from imperative codes

### JSX Pragma

- Unwraps child streams and props stream
- Instantiates and handles Components lifecyles

### xstream patch

- Necessary patch of the xtream library, in the purpose of keeping an "ambiant context" around each operator call, which allows "ghost sources" and "ghost sinks"

### Dependency injection

#### withHooks

This is the main piece. It wraps a component or an entire application, enable the features described here

#### provideSources

A wrapper function to provide or update "ghost sources" in the ambiant context of the executed function. Returns the result of the provided function

```js
const appSinks = provideSources({ message: xs.of("hello") }, App);

const appSinks = provideSources(
  (sources) => ({ ...sources, message: message.map(toUpper) }),
  App
);
```

#### makeGatherSinks

A wrapper function factory. The returned function `gatherSinks()` can wrap and call any function. It's returned values contains the provided function's results, and the all the gathered `sinks` collected with `registerSinks(sinks)`

```js
const gatherSinks = makeGatherSinks(["click$"]);

const [ghostSinks, appSinks] = gatherSinks(() => App(sources));

console.log(ghostSinks); // --> { click$: Stream }
```

#### withContext

The base of all other wrapper functions. It takes a key, a value, and a function to execute. This function will then be executed with the value available through `useContext(key)`

### Hooks

Inspired from vue `inject` and composition API, React's Context API and hooks (kinda inspired by algebraic effects)

#### useEffect

A shortcut to `registerSinks({ effects: stream$ })`

#### onUnmount

Executes an optional callback on unmount. Unmount happens when :

- if it's inside a function call, eg. in an operator, unmount will be called
- if it's inside a component call, unmount will be called when the component is removed from the vtree

#### registerSinks

Register sinks for the current context. Those sinks will be gathered by the closest `gatherSinks()` call in the call stack. It automatically takes care of unsubscription, ending on `unmount`.

#### useState

Similar to React's `useState`, except that the value is wrapped in a Stream. Allows to keep an atomic local state

#### useGlobalState

Similar to React's `useState`, except that the value is wrapped in a Stream. It's a tiny "imperative" wrapper around @cycle/state

#### useContext

The sibling of `withContext`, it's the base building block of the other hooks.

#### useLogger (TODO)

Probably a good use case

#### useI18n (TODO)

Probably a good use case too, but what about language change ????

### makeSubject / makeMemorySubject

It's the base building block of the imperative style hooks. Its purpose is to permit an imperative syntaxe for DOM events while keeping the traceability of sources and sinks.

### Pros

- More familiar to newcomers from React and Vue3
- Gain in ergonomics
- Keeps cyclejs selling points
- You can opt out at any place
- Compatibility with your existing cycle application

### Cons

- More concepts to learn
- For test, need to know which dependencies to inject to a component
- Harder to type :
  - A component does not carry anymore its dependencies and effects signature
  - Gathered sinks and provided sources are not typed
- xstream support only (for now)
  - xstream monkey patching

## Recipes

### Dependency injection

You can pass a value with

```js
const result = withContext(key, value, () => func());
```

Down the call stack, you can then use its value

```js
const value = useContext(key);
```

### Creating a hook

Well, that's DOM-less Cycle component.

But thanks to the context API it's not necessary to pass sinks and sinks all the way. You can focus on your API. `useSources`, `registerSinks` and `makeSubject` are your friends here.

### Testing

If you want to test a component using this API, all you have to do is wrap it :

```js
const sinks = withHooks(Component)(sources);
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
