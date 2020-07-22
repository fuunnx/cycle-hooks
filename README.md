(library not yet released, still in alpha)

# Cycle hooks

See [motivations](#motivations)

## Setup

```
yarn add cycle-hooks
```

```
npm install cycle-hooks --save
```

## Setup your App :

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

### Using JSX

## Motivations

I got this idea after working at work on a Vue 3 project with composition API

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

This lib aims to provide an ergonomic similar to ones in vue3/react hooks in cyclejs, without loosing Cycle strong selling points, and to lower the barrier of entry for new users.

### But isn't it impure ?

Yes and no

```js
// while this is impure
function HookComponent() {
  const category = new Symbol();
  const HTTP = useSources().HTTP;

  registerSinks({
    HTTP: xs.of({
      method: "GET",
      url: "example.com",
      category,
    }),
  });

  return {
    DOM: HTTP.select(category)
      .flatten()
      .startWith('(???)')
      .map((res) => h("p", ["Hello", res.body.name])).,
  };
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

- issue about HTTP requests (solved in cycle-next)
- issue about DOM composition (solved by cyrenajs)
- issue about onEvent listener

## How ? And what's inside ?

### Effects driver

### JSX Pragma

### xstream patch

### Dependency injection

#### withHooks

#### provideSources

#### makeGatherSinks

#### withContext

### Hooks

#### useEffect

#### registerSinks

#### useState

#### useGlobalState (TODO)

#### useContext

#### useLogger

#### useI18n

### makeSubject / makeMemorySubject

### Pros

- More familiar to newcomers from React and Vue3
- Gain in ergonomics
- Keeps cyclejs selling points
- You can opt out at any place
- Compatibility with your existing cycle application

### Cons

- More concepts to learn
- For test, need to inject the right dependencies to a component
- Harder to type :
  - A component does not carry anymore its dependencies and effects signature
  - Gathered sinks and provided sources are not typed
- xstream support only (for now)
  - xstream monkey patching

## Recipes

### Creating a hook

### Testing

### Changing a child's sources

### Changing a child's sinks

## Related work

- cyrenajs
- cycle-next
- vue 3 composition api
- react hooks
