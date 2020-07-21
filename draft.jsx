export function main(sources) {
  const [view$, sinks] = gatherSinks(() => provideSources(sources, App));

  return { ...sinks, DOM: view$ };
}

function App() {
  const log = useLogger();

  const [name$, setName] = useState();
  const [response$, FetchButton] = useFetchButton();

  const sources = useSources()
  return name$.map((name) => {
    const Button = provideSources(FetchButton)
    return (
      <>
        <input
          type="text"
          onInput={(e) => {
            setName(e.target.value);
            log(e.target.value);
          }}
          value={name}
        />
        <provideSources(FetchButton) name={name} />
      </>
    );
  });
}

function useFetchButton(props$) {
  const [response$, { post }] = useHTTP();

  return [
    response$,
    xs
      .combine(response$.map((x) => x.response$).flatten(), props$)
      .map(([res, { name }]) => {
        return (
          <button
            onClick={() => {
              post("lol");
            }}
          >
            {res}
            {name}
          </button>
        );
      }),
  ];
}

function hooked(func) {
  return func(registerSinks)
}

function useLogger() {
  const { event$, listener } = Subject();

  registerSinks({
    Log: event$,
  });

  return function log(val) {
    listener.next(val);
  };
}

function useHTTP() {
  const category = new Symbol();
  const { event$, listener } = Subject();

  const { HTTP } = useSources();
  registerSinks({
    HTTP: event$,
  });

  const stream$ = HTTP.filter((x) => x.category === category);
  return [
    stream$,
    {
      get(opts) {
        listener.next(opts);
        return stream$;
      },
      post(opts) {
        listener.next(opts);
        return stream$;
      },
    },
  ];
}

function useState() {
  const { value$, listener } = MemorySubject();
  return [
    value$,
    function setValue(val) {
      listener.next(val);
    },
  ];
}

function h(tag, props, children) {
  if (typeof tag !== "function") return createElement(tag, props, children);
  const sources = useSources();
  const [props$, setProps] = MemorySubject(props);
  const [stop$, sendStop] = Subject();
  let rerender = { value: 0 };

  return thunk(
    () => ({
      ...x,
      onInsert(el) {
        let [view$, sinks] = gatherSinks(tag(sources, props$));
        registerSinks(map((x$) => x$.endWhen(stop$), sinks));
      },
      onChange() {
        setProps(props);
      },
      onRemove(el) {
        sendStop.next();
      },
    }),
    [rerender]
  );
}

let globalSinks = {
  register: null,
};
function gatherSinks(func) {
  let previous = globalSinks.register;
  let sinks = {};
  globalSinks.register = function registerSinks(registered) {
    sinks = mergeSinks<[any, ...any[]])>([sinks, registered]);
  };
  const returnValue = func();
  globalSinks.register = previous;
  return [returnValue, sinks];
}

function registerSinks(sinks) {
  if (!globalSinks.register) throw new Error("nop");
  const stop$ = useUnmount()
  return globalSinks.register(map(sink$ => sink$.endWhen(stop$), sinks));
}

let globalSources = { current: null };
function provideSources(sources, func) {
  let previous = globalSources.current;
  globalSources.current = { ...globalSources.current, ...sources };
  const returnValue = func();
  globalSources.current = previous;
  return returnValue;
}



function useSources() {
  if (!globalSources.current) throw new Error("nop");
  return globalSources.current;
}

function useUnmount() {
  return
}
