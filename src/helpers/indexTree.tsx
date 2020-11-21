export function indexTree<T>(
  input: any,
  match: (val: any) => val is T,
  stop: (val: any) => boolean = match,
) {
  let indexed: { value: T; path: (string | number)[] }[] = []

  function run(value, path: (string | number)[]) {
    if (match(value)) {
      indexed.push({
        value,
        path,
      })
      if (stop === match) return
    }

    if (!value || typeof value !== 'object') return
    if (stop(value)) return

    if (Array.isArray(value)) {
      value.forEach((x, index) => run(x, [...path, index]))
      return
    }

    Object.entries(value).forEach(([k, v]) => run(v, [...path, k]))
    return
  }

  run(input, [])

  return indexed
}
