import { Stream } from 'xstream'
import { onUnmount } from '../../src/effects/unmount'

export function debug(
  stream$: Stream<any>,
  labelOrSpy?: string | ((x: any) => any),
) {
  let sub = stream$.debug(labelOrSpy as any).subscribe({
    error(err) {
      throw err
    },
  })

  onUnmount(() => sub.unsubscribe())

  return stream$
}
