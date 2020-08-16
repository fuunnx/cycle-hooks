import { withContext, useContext, ContextKey, safeUseContext } from ".";
import xs from "xstream";

type RegisterUnmountCallback = (callback: () => void) => void;

const unMountKey: ContextKey<RegisterUnmountCallback> = Symbol("unmount");

export function withUnmount<T>(exec: () => T) {
  let callbacks = [];
  const returnValue = withContext(
    unMountKey,
    (callback) => {
      callbacks.push(callback);
    },
    exec
  );

  onUnmount(triggerUnmount);

  return [triggerUnmount, returnValue] as const;

  function triggerUnmount() {
    callbacks.forEach((x) => x());
  }
}

export function onUnmount(callback: () => void = () => {}) {
  const unmount$ = xs.create();
  safeUseContext(unMountKey)?.(() => {
    callback();
    unmount$.shamefullySendNext(null);
  });
  return unmount$;
}
