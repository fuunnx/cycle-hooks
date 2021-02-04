import { ResponseStream, HTTPSource, RequestInput, Response } from '@cycle/http'
import xs, { Stream, MemoryStream } from 'xstream'
import sample from 'xstream-sample'
import { AppSinks, AppSources } from '..'
import { replay } from '../libs/xstream-replay'

type Cache$ = Stream<{
  [url: string]: MemoryStream<Response> & ResponseStream
}>

export function withHTTPCache(
  func: (sources: AppSources & { cache$: Cache$ }) => AppSinks,
) {
  return function (sources: AppSources) {
    const cache$: Cache$ = sources.HTTP.select()
      .fold((cache, res$) => {
        return {
          ...cache,
          [res$.request.url]: res$.compose(replay),
        }
      }, {})
      .compose(replay)

    return func({ ...sources, cache$ })
  }
}

export function useRequest(
  sources: { cache$?: Cache$; HTTP: HTTPSource; createID: () => string },
  request: RequestInput,
): [{ HTTP: Stream<RequestInput> }, Stream<Response>] {
  const normalized = typeof request === 'string' ? { url: request } : request
  const { cache$, HTTP, createID } = sources

  if (!cache$) {
    const category = createID()

    return [
      {
        HTTP: xs.of({ ...normalized, category }),
      },
      HTTP.select(category).flatten(),
    ]
  }

  return [
    {
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
    },
    cache$
      .map((cache) => cache[normalized.url])
      .filter(Boolean)
      .take(1)
      .flatten(),
  ]
}
