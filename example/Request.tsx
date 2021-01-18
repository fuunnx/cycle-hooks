import xs, { MemoryStream, Stream, Subscription } from 'xstream'
import sample from 'xstream-sample'
import { createElement } from '../src'
import { registerSinks } from '../src/hooks/sinks'
import { HTTPSource, RequestInput, ResponseStream, Response } from '@cycle/http'
import { useSources, withSources } from '../src/hooks/sources'
import { useProps$ } from '../src/hooks/props'
import { useRequest, withHTTPCache } from './hooks/useRequest'

type Props = {
  userId?: string
}

export const Request = (_: Props) => {
  return useProps$<Props>()
    .map((props) => {
      const { userId } = props
      return useRequest({
        url: userId
          ? `http://jsonplaceholder.typicode.com/albums?userId=${userId}`
          : `http://jsonplaceholder.typicode.com/albums`,
      }).map((x) => x.body)
    })
    .flatten()
    .startWith([])
    .map((res) => <div>Albums count: {res.length}</div>)
}
