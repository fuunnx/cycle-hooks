import { VNode } from 'snabbdom/build/package/vnode'

type VTree<T> =
  | T
  | {
      children?: VTree<T>[]
    }

export function indexVTree<T, M>(
  vtree: VTree<T>,
  isMatch: (val: any) => val is M,
  isStop: (val: any) => boolean = isMatch,
) {
  let indexed: { value: M; path: number[] }[] = []

  walkVTree(vtree, (value: VTree<T>, path: number[]) => {
    if (isMatch(value)) {
      indexed.push({
        value,
        path,
      })
      if (isStop === isMatch) return false
    }

    if (isStop(value)) {
      return false
    }
  })

  return indexed
}

export function walkVTree<T>(
  vTree: VTree<T>,
  callback: (vTree: VTree<T>, path: number[]) => void | boolean,
) {
  function walk(value: VTree<T>, path: number[]) {
    const canContinue = callback(value, path)
    if (canContinue === false) return
    if (typeof value !== 'object') return
    if (!('children' in value)) return
    if (!Array.isArray(value.children)) return

    value.children.forEach((child, index) => {
      return walk(child, [...path, index])
    })
  }

  walk(vTree, [])
}

export function isVNode(vnode: any): vnode is VNode {
  return vnode && (vnode.sel !== undefined || vnode.text !== undefined)
}

export function assocVTree(path: number[], value: string | VNode, host: VNode) {
  if (!path.length) {
    return value
  }

  const index = path[0]
  if (path.length === 1) {
    return assocChild(index, value, host)
  }

  if (!host.children) host.children = []
  const childTarget = host.children[index]
  if (!isVNode(childTarget)) {
    console.warn("can't assoc to a string")
    return host
  }

  return assocChild(index, assocVTree(path.slice(1), value, childTarget), host)
}

export function assocChild(
  index: number,
  value: number | string | null | undefined | boolean | VNode,
  host: VNode,
): VNode {
  // prettier-ignore
  const node: VNode | null = 
    isEmptyNode(value) ? null
    : isVNode(value) ? value
    : TextNode(value)

  let children: (string | VNode)[] = [node]

  if (host.children) {
    children = host.children.slice(0, index)
    children.push(node, ...host.children.slice(index + 1))
  }

  return { ...host, children }
}

function isEmptyNode(value: any) {
  return value === undefined || value === null || value === false
}

function TextNode(content: string | number | boolean): VNode {
  return {
    text: String(content),
    children: undefined,
    data: undefined,
    elm: undefined,
    key: undefined,
    sel: undefined,
  }
}
