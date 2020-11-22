import { Stream } from 'xstream'
import xs, { MemoryStream } from 'xstream'

// TODO explore how to make it visualisable
export function useSubject<T>(): [Stream<T>, (value: T) => void] {
  const stream$ = xs.create<T>()

  return [
    stream$,
    function next(value: T) {
      stream$.shamefullySendNext(value)
    },
  ]
}

export function useMemorySubject<T>(
  initial: T,
): [MemoryStream<T>, (value: T) => void] {
  const [stream$, next] = useSubject<T>()

  return [stream$.startWith(initial), next]
}
