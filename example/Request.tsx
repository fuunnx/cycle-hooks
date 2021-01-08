import { Stream } from 'xstream'
import { createElement } from '../src'
import { registerSinks } from '../src/hooks/sinks'
import { HTTPSource, RequestInput } from '@cycle/http'
import { useSources } from '../src/hooks/sources'
import { useProps$ } from '../src/hooks/props'

type Props = {
  userId?: string
}

export const Request = (_: Props) => {
  const res$ = useRequest(
    useProps$<Props>().map((props) => {
      const { userId } = props
      if (!userId) {
        return {
          url: `http://jsonplaceholder.typicode.com/albums`,
        }
      }

      return {
        url: `http://jsonplaceholder.typicode.com/albums?userId=${userId}`,
      }
    }),
  )
    .flatten()
    .map((x) => x.body)

  return res$.startWith([]).map((res) => <div>Albums count: {res.length}</div>)
}

function useRequest(request$: Stream<RequestInput>) {
  const category = (Symbol('get albums') as unknown) as string

  registerSinks<{ HTTP: Stream<RequestInput> }>({
    HTTP: request$.map((request) => {
      if (typeof request === 'string') {
        return {
          url: request,
          category,
        }
      }

      return {
        ...request,
        category,
      }
    }),
  })

  return useSources<{ HTTP: HTTPSource }>().HTTP.select(category)
}
