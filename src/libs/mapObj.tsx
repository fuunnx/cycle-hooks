export function mapObj<T extends { [key: string]: U }, U, V>(
  func: (a: U) => V,
  obj: T,
): {
  [P in keyof T]: V
} {
  let result: any = {}
  for (let key in obj) {
    result[key] = func(obj[key])
  }

  return result
}
