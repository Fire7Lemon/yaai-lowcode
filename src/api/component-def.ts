import { componentDefs } from '@/mock/database'
import type { ListResult } from '@/types/api'
import type {
  ComponentDef,
  ComponentDefCreateInput,
  ComponentDefQuery,
  ComponentDefUpdateInput,
} from '@/types/component-def'

import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'

export const componentDefApiDrafts = {
  list: apiDraftMeta('/component-defs', 'GET', true),
  detail: apiDraftMeta('/component-defs/{id}', 'GET', true),
  create: apiDraftMeta('/component-defs', 'POST', true),
  update: apiDraftMeta('/component-defs/{id}', 'PUT', true),
  status: apiDraftMeta('/component-defs/{id}/status', 'PATCH', false, 'TODO: 是否统一走 PUT 待确认'),
  byKey: apiDraftMeta('/component-defs/by-key/{componentKey}', 'GET', true),
}

export async function listComponentDefs(query: ComponentDefQuery = {}): Promise<ListResult<ComponentDef>> {
  return mockResolve(buildListResult(componentDefs.filter((item) => includesQueryValue(item, query))))
}

export async function getComponentDef(id: number): Promise<ComponentDef | undefined> {
  return mockResolve(componentDefs.find((item) => item.id === id))
}

export async function getComponentDefByKey(componentKey: string): Promise<ComponentDef | undefined> {
  return mockResolve(componentDefs.find((item) => item.component_key === componentKey))
}

export async function createComponentDef(payload: ComponentDefCreateInput): Promise<ComponentDef> {
  const item: ComponentDef = {
    ...payload,
    id: nextNumericId(componentDefs),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  componentDefs.push(item)
  return mockResolve(item)
}

export async function updateComponentDef(
  id: number,
  payload: ComponentDefUpdateInput,
): Promise<ComponentDef | undefined> {
  const index = componentDefs.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  componentDefs[index] = {
    ...componentDefs[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(componentDefs[index])
}

export async function setComponentDefStatus(id: number, status: boolean): Promise<ComponentDef | undefined> {
  const item = componentDefs.find((component) => component.id === id)
  if (!item) {
    return mockResolve(undefined)
  }
  item.status = status
  item.updated_at = new Date().toISOString()
  return mockResolve(item)
}
