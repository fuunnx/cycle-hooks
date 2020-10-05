## first release

- [ ] implement eventListeners with `useEffect(DOM.select(key).events(name).map(evt => () => handler(evt)))`
- [ ] idGenerator -> should be injected (replace symbols in Subject)
- [ ] prevent scope creep : minimal features, remove unnecessary stuff
- [ ] change terms : different words for same concepts : useContext/onUnmount/registerSinks, withContext/provideSources/gatherSinks : rename with handler / effect / frame / context ?
- [ ] provide better typings

## Design principles

- [ ] Imperative stuff should be sugar but not the main way of programming
- [ ] Explore how the stream graph could be preserved despite the sugar

## someday

- [ ] File an issue about mergeSinks causing a maximum call stack error in typescript, if no type arguments provided
- [ ] measure performance overhead
- [ ] with cycle neo
- [ ] with react

## Maybe someday

- [ ] channels are hardcoded (by convention) : HTTP, DOM, state, etc. -> allow overrides by injecting that ?
- [ ] provide real hooks for pre / post process stuff
