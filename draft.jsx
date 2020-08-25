function App() {
  const log = useLogger();

  const [name$, setName] = useState();
  const [response$, FetchButton] = useFetchButton();

  return name$.map((name) => {
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
        <FetchButton name={name} />
      </>
    );
  });
}

function useFetchButton(props$) {
  const [response$, { post }] = useHTTP();

  return [
    response$,
    () =>
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
