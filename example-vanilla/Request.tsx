import { div } from '@cycle/dom'
import { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { useRequest } from './hooks/useRequest'

type Props = {
  userId?: string
}

export const Request = (sources, props$: Stream<Props>) => {
  const request = props$
    .map((x) => x.userId)
    .compose(dropRepeats())
    .map((userId) => {
      return useRequest(sources, {
        url: userId
          ? `http://jsonplaceholder.typicode.com/albums?userId=${userId}`
          : `http://jsonplaceholder.typicode.com/albums`,
      })
    })

  const HTTP = request.map((x) => x[0].HTTP).flatten()

  const result$ = request
    .map((x) => x[1])
    .flatten()
    .map((x) => x.body)
    .startWith([])

  return {
    HTTP,
    DOM: result$.map((res) => div(`Albums count: ${res.length}`)),
  }
}
