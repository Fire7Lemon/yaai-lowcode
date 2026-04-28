import { pageNodes, pageTemplates } from '@/mock/database'
import type { IdResponse, ListResult, NodeCollectionResponse } from '@/types/api'
import type {
  PageTemplate,
  PageTemplateCreateInput,
  PageTemplateQuery,
  PageTemplateUpdateInput,
} from '@/types/page-template'
import type {
  PageNode,
  PageTemplateNodeTreeResponse,
  SavePageNodeTreePayload,
} from '@/types/page-node'

import { materializeSavedNodes } from './page-node'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'

export const pageTemplateApiDrafts = {
  list: apiDraftMeta('/page-templates', 'GET', true),
  detail: apiDraftMeta('/page-templates/{id}', 'GET', true),
  create: apiDraftMeta('/page-templates', 'POST', true),
  update: apiDraftMeta('/page-templates/{id}', 'PUT', true),
  remove: apiDraftMeta('/page-templates/{id}', 'DELETE', true),
  nodeTree: apiDraftMeta('/page-templates/{id}/node-tree', 'GET', true),
  saveNodeTree: apiDraftMeta(
    '/page-templates/{id}/node-tree',
    'PUT',
    false,
    'TODO: 整树保存时前端临时 ID 与后端真实 ID 的映射机制待确认',
  ),
}

export async function listPageTemplates(query: PageTemplateQuery = {}): Promise<ListResult<PageTemplate>> {
  return mockResolve(buildListResult(pageTemplates.filter((item) => includesQueryValue(item, query))))
}

export async function getPageTemplate(id: number): Promise<PageTemplate | undefined> {
  return mockResolve(pageTemplates.find((item) => item.id === id))
}

export async function createPageTemplate(payload: PageTemplateCreateInput): Promise<PageTemplate> {
  const item: PageTemplate = {
    ...payload,
    id: nextNumericId(pageTemplates),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  pageTemplates.push(item)
  return mockResolve(item)
}

export async function updatePageTemplate(id: number, payload: PageTemplateUpdateInput): Promise<PageTemplate | undefined> {
  const index = pageTemplates.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  pageTemplates[index] = {
    ...pageTemplates[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(pageTemplates[index])
}

export async function deletePageTemplate(id: number): Promise<IdResponse | undefined> {
  const index = pageTemplates.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  pageTemplates.splice(index, 1)
  return mockResolve({ id })
}

export async function getTemplateNodeTree(id: number): Promise<PageTemplateNodeTreeResponse | undefined> {
  const template = pageTemplates.find((item) => item.id === id)
  if (!template) {
    return mockResolve(undefined)
  }
  return mockResolve({
    template,
    nodes: pageNodes.filter((item) => item.template_id === id),
  })
}

export async function saveTemplateNodeTree(
  id: number,
  payload: SavePageNodeTreePayload,
): Promise<NodeCollectionResponse<PageNode> | undefined> {
  const template = pageTemplates.find((item) => item.id === id)
  if (!template) {
    return mockResolve(undefined)
  }

  const remain = pageNodes.filter((item) => item.template_id !== id)
  const nextNodes = materializeSavedNodes(payload.nodes, {
    page_version_id: null,
    template_id: id,
    fragment_id: null,
  })

  pageNodes.splice(0, pageNodes.length, ...remain, ...nextNodes)
  return mockResolve({ nodes: nextNodes })
}
