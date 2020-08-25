import { ContextKey, safeUseContext, withContext } from ".";
import xs from "xstream";

type RegisterUnmountCallback = (callback: () => void) => void;

const unMountKey: ContextKey<RegisterUnmountCallback> = Symbol("unmount");
const unMountKeyComp: ContextKey<RegisterUnmountCallback> = Symbol("unmount");
const unMountKeyStream: ContextKey<RegisterUnmountCallback> = Symbol("unmount");

export function withUnmount<T>(
  exec: () => T,
  type: "component" | "stream" = "stream"
) {
  let callbacks = [];
  function addListener(callback) {
    callbacks.push(callback);
  }

  const key: ContextKey<RegisterUnmountCallback> =
    type === "stream" ? unMountKeyStream : unMountKeyComp;

  const returnValue = withContext(
    [
      [unMountKey, addListener],
      [key, addListener],
    ],
    exec
  );

  safeUseContext(key)?.(triggerUnmount);

  return [triggerUnmount, returnValue] as const;

  function triggerUnmount() {
    callbacks.forEach((x) => x());
  }
}

export function onUnmount(callback: () => void = () => {}) {
  const unmount$ = xs.create();
  let unmounted = false;
  safeUseContext(unMountKey)?.(() => {
    if (unmounted) return;

    callback();
    unmount$.shamefullySendNext(null);

    unmounted = true;
  });
  return unmount$;
}
