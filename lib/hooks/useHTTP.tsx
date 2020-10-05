import { useSubject } from '../helpers/subjects'
import { useSources } from '.'
import { registerSinks } from '../hooks/sinks'

// TODO needs tests and proper typings
export function useHTTP() {
  const category = Symbol('HTTP')
  const [event$, request] = useSubject()

  const { HTTP } = useSources()

  if (!HTTP) {
    throw new Error('Please provide an HTTPdriver on the HTTP channel')
  }

  registerSinks({
    HTTP: event$,
  })

  const stream$ = HTTP.filter((x) => x.category === category)
  return [
    stream$,
    {
      get(opts) {
        request(opts)
        return stream$
      },
      post(opts) {
        request(opts)
        return stream$
      },
    },
  ]
}
