import { menus } from '@/mock/database'
import type { IdResponse, ListResult } from '@/types/api'
import type { Menu, MenuCreateInput, MenuQuery, MenuUpdateInput, MoveMenuInput } from '@/types/menu'

import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'

export const menuApiDrafts = {
  list: apiDraftMeta('/menus', 'GET', true),
  detail: apiDraftMeta('/menus/{id}', 'GET', true),
  create: apiDraftMeta('/menus', 'POST', true),
  update: apiDraftMeta('/menus/{id}', 'PUT', true),
  remove: apiDraftMeta('/menus/{id}', 'DELETE', true),
  move: apiDraftMeta('/menus/{id}/move', 'POST', false, 'TODO: 是否统一与 update 合并待确认'),
}

export async function listMenus(query: MenuQuery = {}): Promise<ListResult<Menu>> {
  return mockResolve(buildListResult(menus.filter((item) => includesQueryValue(item, query))))
}

export async function getMenu(id: number): Promise<Menu | undefined> {
  return mockResolve(menus.find((item) => item.id === id))
}

export async function createMenu(payload: MenuCreateInput): Promise<Menu> {
  const item: Menu = {
    ...payload,
    id: nextNumericId(menus),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  menus.push(item)
  return mockResolve(item)
}

export async function updateMenu(id: number, payload: MenuUpdateInput): Promise<Menu | undefined> {
  const index = menus.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  menus[index] = {
    ...menus[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(menus[index])
}

export async function deleteMenu(id: number): Promise<IdResponse | undefined> {
  const nextMenus = menus.filter((item) => item.id !== id && item.parent_id !== id)
  if (nextMenus.length === menus.length) {
    return mockResolve(undefined)
  }
  menus.splice(0, menus.length, ...nextMenus)
  return mockResolve({ id })
}

export async function moveMenu(id: number, payload: MoveMenuInput): Promise<Menu | undefined> {
  const item = menus.find((menu) => menu.id === id)
  if (!item) {
    return mockResolve(undefined)
  }
  item.parent_id = payload.parent_id
  item.sort_order = payload.sort_order
  item.updated_at = new Date().toISOString()
  return mockResolve(item)
}
