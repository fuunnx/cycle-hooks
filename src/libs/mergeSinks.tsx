import { Sinks } from '../types'
import { mergeSinks as mergeSinks_ } from 'cyclejs-utils'
// or else creates a maximum call stack error on typescript
interface MergeSinks {
  (sinks: Sinks[], opts?: object): Sinks
}
export const mergeSinks = mergeSinks_ as MergeSinks
