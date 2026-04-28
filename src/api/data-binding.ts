import { dataBindingPreviewMap, dataBindings } from '@/mock/database'
import type { IdResponse, ListResult } from '@/types/api'
import type {
  DataBinding,
  DataBindingCreateInput,
  DataBindingPreviewResponse,
  DataBindingQuery,
  DataBindingUpdateInput,
} from '@/types/data-binding'

import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'

export const dataBindingApiDrafts = {
  list: apiDraftMeta('/data-bindings', 'GET', true),
  detail: apiDraftMeta('/data-bindings/{id}', 'GET', true),
  create: apiDraftMeta('/data-bindings', 'POST', true),
  update: apiDraftMeta('/data-bindings/{id}', 'PUT', true),
  remove: apiDraftMeta('/data-bindings/{id}', 'DELETE', true),
  preview: apiDraftMeta(
    '/data-bindings/{id}/preview',
    'POST',
    false,
    'TODO: 是否同时返回原始源数据，以及是否支持临时覆盖 query_json 待确认',
  ),
}

export async function listDataBindings(query: DataBindingQuery = {}): Promise<ListResult<DataBinding>> {
  return mockResolve(buildListResult(dataBindings.filter((item) => includesQueryValue(item, query))))
}

export async function getDataBinding(id: number): Promise<DataBinding | undefined> {
  return mockResolve(dataBindings.find((item) => item.id === id))
}

export async function createDataBinding(payload: DataBindingCreateInput): Promise<DataBinding> {
  const item: DataBinding = {
    ...payload,
    id: nextNumericId(dataBindings),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  dataBindings.push(item)
  return mockResolve(item)
}

export async function updateDataBinding(
  id: number,
  payload: DataBindingUpdateInput,
): Promise<DataBinding | undefined> {
  const index = dataBindings.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  dataBindings[index] = {
    ...dataBindings[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(dataBindings[index])
}

export async function deleteDataBinding(id: number): Promise<IdResponse | undefined> {
  const index = dataBindings.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  dataBindings.splice(index, 1)
  return mockResolve({ id })
}

export async function previewDataBinding(id: number): Promise<DataBindingPreviewResponse | undefined> {
  const binding = dataBindings.find((item) => item.id === id)
  if (!binding) {
    return mockResolve(undefined)
  }

  return mockResolve({
    binding,
    preview_data: dataBindingPreviewMap[id] ?? [],
  })
}
