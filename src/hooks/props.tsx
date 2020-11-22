import { useSources } from './sources'
import { Stream } from 'xstream'

export function useProps<Props>() {
  return useSources().props$ as Stream<Props>
}
