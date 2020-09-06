declare module 'multi-key-cache' {
  class MultiKeyCache<K extends Array<unknown>, V> {
    new(): MultiKeyCache<K, V>
    has(keys: K): boolean
    get(keys: K): V | undefined
    set(keys: K, value: V): void
    delete(keys: K): boolean
    values(): V[]
    keyNodes(): K[]
  }
  export = MultiKeyCache
}
