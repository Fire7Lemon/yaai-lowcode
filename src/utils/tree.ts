import type { Menu } from '@/types/menu'
import type { PageNode } from '@/types/page-node'

interface TreeNode<T> {
  item: T
  children: Array<TreeNode<T>>
}

export interface NodeTreeItem extends PageNode {
  children: NodeTreeItem[]
}

export interface MenuTreeItem extends Menu {
  children: MenuTreeItem[]
}

function buildTree<T extends { id: number; parent_id: number | null; sort_order: number | null }>(
  items: T[],
): Array<TreeNode<T>> {
  const map = new Map<number, TreeNode<T>>()
  const roots: Array<TreeNode<T>> = []

  items.forEach((item) => {
    map.set(item.id, {
      item,
      children: [],
    })
  })

  items.forEach((item) => {
    const current = map.get(item.id)

    if (!current) {
      return
    }

    if (item.parent_id === null) {
      roots.push(current)
      return
    }

    const parent = map.get(item.parent_id)
    if (parent) {
      parent.children.push(current)
    } else {
      roots.push(current)
    }
  })

  const sortFn = <X extends { item: { sort_order: number | null }; children: X[] }>(treeItems: X[]) => {
    treeItems.sort((left, right) => (left.item.sort_order ?? 0) - (right.item.sort_order ?? 0))
    treeItems.forEach((treeItem) => sortFn(treeItem.children))
  }

  sortFn(roots)
  return roots
}

export function buildNodeTree(items: PageNode[]): NodeTreeItem[] {
  return buildTree(items).map(function toNodeTree(treeNode): NodeTreeItem {
    return {
      ...treeNode.item,
      children: treeNode.children.map(toNodeTree),
    }
  })
}

export function flattenNodeTree(items: NodeTreeItem[]): PageNode[] {
  const result: PageNode[] = []

  const visit = (treeItem: NodeTreeItem) => {
    const { children, ...current } = treeItem
    result.push(current)
    children.forEach(visit)
  }

  items.forEach(visit)
  return result
}

export function buildMenuTree(items: Menu[]): MenuTreeItem[] {
  return buildTree(items).map(function toMenuTree(treeNode): MenuTreeItem {
    return {
      ...treeNode.item,
      children: treeNode.children.map(toMenuTree),
    }
  })
}
