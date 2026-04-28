import { pageNodes, reusableFragments } from '@/mock/database'
import type { IdResponse, ListResult, NodeCollectionResponse } from '@/types/api'
import type {
  ReusableFragment,
  ReusableFragmentCreateInput,
  ReusableFragmentQuery,
  ReusableFragmentUpdateInput,
} from '@/types/reusable-fragment'
import type {
  PageNode,
  ReusableFragmentNodeTreeResponse,
  SavePageNodeTreePayload,
} from '@/types/page-node'

import { materializeSavedNodes } from './page-node'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'

export const reusableFragmentApiDrafts = {
  list: apiDraftMeta('/reusable-fragments', 'GET', true),
  detail: apiDraftMeta('/reusable-fragments/{id}', 'GET', true),
  create: apiDraftMeta('/reusable-fragments', 'POST', true),
  update: apiDraftMeta('/reusable-fragments/{id}', 'PUT', true),
  remove: apiDraftMeta('/reusable-fragments/{id}', 'DELETE', true),
  nodeTree: apiDraftMeta('/reusable-fragments/{id}/node-tree', 'GET', true),
  saveNodeTree: apiDraftMeta(
    '/reusable-fragments/{id}/node-tree',
    'PUT',
    false,
    'TODO: 整树保存时前端临时 ID 与后端真实 ID 的映射机制待确认',
  ),
}

export async function listReusableFragments(
  query: ReusableFragmentQuery = {},
): Promise<ListResult<ReusableFragment>> {
  return mockResolve(buildListResult(reusableFragments.filter((item) => includesQueryValue(item, query))))
}

export async function getReusableFragment(id: number): Promise<ReusableFragment | undefined> {
  return mockResolve(reusableFragments.find((item) => item.id === id))
}

export async function createReusableFragment(payload: ReusableFragmentCreateInput): Promise<ReusableFragment> {
  const item: ReusableFragment = {
    ...payload,
    id: nextNumericId(reusableFragments),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  reusableFragments.push(item)
  return mockResolve(item)
}

export async function updateReusableFragment(
  id: number,
  payload: ReusableFragmentUpdateInput,
): Promise<ReusableFragment | undefined> {
  const index = reusableFragments.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  reusableFragments[index] = {
    ...reusableFragments[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(reusableFragments[index])
}

export async function deleteReusableFragment(id: number): Promise<IdResponse | undefined> {
  const index = reusableFragments.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  reusableFragments.splice(index, 1)
  return mockResolve({ id })
}

export async function getFragmentNodeTree(id: number): Promise<ReusableFragmentNodeTreeResponse | undefined> {
  const fragment = reusableFragments.find((item) => item.id === id)
  if (!fragment) {
    return mockResolve(undefined)
  }
  return mockResolve({
    fragment,
    nodes: pageNodes.filter((item) => item.fragment_id === id),
  })
}

export async function saveFragmentNodeTree(
  id: number,
  payload: SavePageNodeTreePayload,
): Promise<NodeCollectionResponse<PageNode> | undefined> {
  const fragment = reusableFragments.find((item) => item.id === id)
  if (!fragment) {
    return mockResolve(undefined)
  }

  const remain = pageNodes.filter((item) => item.fragment_id !== id)
  const nextNodes = materializeSavedNodes(payload.nodes, {
    page_version_id: null,
    template_id: null,
    fragment_id: id,
  })

  pageNodes.splice(0, pageNodes.length, ...remain, ...nextNodes)
  return mockResolve({ nodes: nextNodes })
}
