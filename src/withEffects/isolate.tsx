import { mergeSinks } from 'cyclejs-utils'
import { collectEffects, performEffects } from '../effects/sinks'
import { useSources, withSources } from '../effects/sources'
import {
  checkIsolateArgs,
  newScope,
  normalizeScopes,
  isolateAllSources,
  isolateAllSinks,
  OuterSi,
  OuterSo,
} from '../patches/isolate'

// There is any issue with isolate :

/**
 * const child = Child()
 * isolate(Parent)(child.DOM.map(children => ({children})))
 *
 * --> the child component will be isolated with the scope of its parent
 *
 * But doing :
 * const child = isolate(Child)()
 *
 * fixes the problem
 * however it's not always what we want
 */

export function isolate<Args extends any[], InnerSo, InnerSi>(
  effectfulComponent: (...args: Args) => InnerSi,
  scope: any = newScope(),
): (...args: Args) => OuterSi<InnerSo, InnerSi> {
  checkIsolateArgs(effectfulComponent as any, scope)

  const randomScope = typeof scope === 'object' ? newScope() : ''
  const scopes: any =
    typeof scope === 'string' || typeof scope === 'object'
      ? scope
      : scope.toString()

  return function wrappedComponent(...args: Args): OuterSi<InnerSo, InnerSi> {
    const outerSources = useSources<OuterSo<InnerSo>>()
    const scopesPerChannel = normalizeScopes(outerSources, scopes, randomScope)
    const innerSources = isolateAllSources(
      outerSources as any,
      scopesPerChannel,
    )
    /* here is the real change */
    const [effects, innerSinks] = collectEffects(() => {
      return withSources(innerSources, () => effectfulComponent(...args))
    })

    performEffects(
      isolateAllSinks(outerSources as any, effects, scopesPerChannel),
    )
    /* end */
    const outerSinks = isolateAllSinks(
      outerSources as any,
      innerSinks,
      scopesPerChannel,
    )

    return outerSinks as any
  }
}
