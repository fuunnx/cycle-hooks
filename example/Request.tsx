import { div } from '@cycle/dom'
import { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { useRequest } from './hooks/useRequest'

type Props = {
  userId?: string
}

export const Request = (props$: Stream<Props>) => {
  return {
    DOM: props$
      .map((x) => x.userId)
      .compose(dropRepeats())
      .map((userId) => {
        return useRequest({
          url: userId
            ? `http://jsonplaceholder.typicode.com/albums?userId=${userId}`
            : `http://jsonplaceholder.typicode.com/albums`,
        }).map((x) => x.body)
      })
      .flatten()
      .startWith([])
      .map((res) => div(`Albums count: ${res.length}`)),
  }
}
