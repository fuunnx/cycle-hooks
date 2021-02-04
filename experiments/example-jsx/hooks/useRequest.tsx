import { ResponseStream, HTTPSource, RequestInput, Response } from '@cycle/http'
import xs, { Stream, MemoryStream } from 'xstream'
import sample from 'xstream-sample'
import { performEffects } from '../../../src/effects/sinks'
import { useSources, withSources } from '../../../src/effects/sources'
import { replay } from '../libs/xstream-replay'

type Cache$ = Stream<{
  [url: string]: MemoryStream<Response> & ResponseStream
}>

export function withHTTPCache<T>(func: () => T) {
  const init = {}
  const cache$: Cache$ = useSources<{ HTTP: HTTPSource }>()
    .HTTP.select()
    .fold((cache, res$) => {
      return {
        ...cache,
        [res$.request.url]: xs.merge(xs.never(), res$.compose(replay)),
      }
    }, init)
    .compose(replay)

  return withSources((sources) => ({ ...sources, cache$ }), func)
}

export function useRequest(request: RequestInput): Stream<Response> {
  const normalized = typeof request === 'string' ? { url: request } : request
  const { cache$, HTTP } = useSources<{ cache$?: Cache$; HTTP: HTTPSource }>()

  if (!cache$) {
    const category = (Symbol('category') as unknown) as string
    performEffects<{ HTTP: Stream<RequestInput> }>({
      HTTP: xs.of({ ...normalized, category }),
    })

    return HTTP.select(category).flatten()
  }

  performEffects<{ HTTP: Stream<RequestInput> }>({
    HTTP: xs
      .of(null)
      .compose(sample(cache$))
      .map((cache) => {
        if (!(normalized.url in cache)) {
          return request
        }

        return null
      })
      .filter(Boolean),
  })

  return cache$
    .map((cache) => cache[normalized.url])
    .filter(Boolean)
    .take(1)
    .flatten()
}
