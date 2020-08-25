import { registerSinks } from "..";
import { makeSubject } from "../driver";

// TODO needs proper typings
export function useLogger() {
  const [event$, log] = makeSubject();

  registerSinks({
    Log: event$,
  });

  return log;
}
