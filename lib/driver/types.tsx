import { Stream } from 'xstream'

export type Effect = [Symbol, unknown]
export type EffectsSources = Stream<Effect>
