import { Stream } from 'xstream'
import { createElement } from '../jsx'
import { useRequest, withHTTPCache } from './hooks/useRequest'

type Props = {
  userId?: string
}

export const Request = (props$: Props | Stream<Props>) => {
  return streamify(props$)
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
