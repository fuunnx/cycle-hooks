import { Sinks } from "./types";
import { mergeSinks as mergeSinks_ } from "cyclejs-utils";

export function mapObj<T extends { [key: string]: U }, U, V>(
  func: (a: U) => V,
  obj: T
): { [P in keyof T]: V } {
  let result: any = {};
  for (let key in obj) {
    result[key] = func(obj[key]);
  }

  return result;
}

// or else creates a maximum call stack error on typescript
interface MergeSinks {
  (sinks: Sinks[], opts?: object): Sinks;
}
export const mergeSinks = mergeSinks_ as MergeSinks;
