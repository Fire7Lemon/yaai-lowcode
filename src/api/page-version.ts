import { pageNodes, pageVersions, pages } from '@/mock/database'
import type { IdResponse, ListResult } from '@/types/api'
import type {
  ClonePageVersionPayload,
  CreatePageVersionFromTemplatePayload,
  CreatePageVersionPayload,
  PageVersion,
  PageVersionQuery,
  PublishPageVersionResponse,
} from '@/types/page-version'

import { getTemplateNodeTree } from './page-template'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'

export const pageVersionApiDrafts = {
  list: apiDraftMeta('/pages/{pageId}/versions', 'GET', true),
  detail: apiDraftMeta('/page-versions/{id}', 'GET', true),
  create: apiDraftMeta('/pages/{pageId}/versions', 'POST', true),
  remove: apiDraftMeta('/page-versions/{id}', 'DELETE', false, 'TODO: 仅允许删除未发布版本'),
  createFromTemplate: apiDraftMeta(
    '/pages/{pageId}/versions/from-template',
    'POST',
    true,
  ),
  publish: apiDraftMeta('/page-versions/{id}/publish', 'POST', false, 'TODO: 发布异常时是否整体回滚待确认'),
  lock: apiDraftMeta('/page-versions/{id}/lock', 'POST', false, 'TODO: 是否改为 PATCH 待确认'),
  unlock: apiDraftMeta('/page-versions/{id}/unlock', 'POST', false, 'TODO: 是否改为 PATCH 待确认'),
  clone: apiDraftMeta('/page-versions/{id}/clone', 'POST', false, 'TODO: version_name 不传时的命名规则待确认'),
}

function now() {
  return new Date().toISOString()
}

function createVersionRecord(pageId: number, payload: { version_name: string | null; source_type: PageVersion['source_type']; source_id: number | null; remark: string | null }): PageVersion {
  const nextVersionNo =
    Math.max(0, ...pageVersions.filter((item) => item.page_id === pageId).map((item) => item.version_no)) + 1

  const item: PageVersion = {
    id: nextNumericId(pageVersions),
    page_id: pageId,
    version_no: nextVersionNo,
    version_name: payload.version_name,
    source_type: payload.source_type,
    source_id: payload.source_id,
    status: 'draft',
    is_locked: false,
    remark: payload.remark,
    created_by: 'system',
    created_at: now(),
    updated_at: now(),
  }

  pageVersions.push(item)
  return item
}

function cloneNodesToVersion(sourceVersionId: number, targetVersionId: number) {
  const sourceNodes = pageNodes.filter((node) => node.page_version_id === sourceVersionId)
  const idMap = new Map<number, number>()

  sourceNodes.forEach((node) => {
    idMap.set(node.id, nextNumericId(pageNodes) + idMap.size)
  })

  sourceNodes.forEach((node) => {
    const newId = idMap.get(node.id)
    if (!newId) {
      return
    }
    pageNodes.push({
      ...node,
      id: newId,
      page_version_id: targetVersionId,
      template_id: null,
      fragment_id: null,
      parent_id: node.parent_id === null ? null : (idMap.get(node.parent_id) ?? null),
      depth: node.depth,
      created_at: now(),
      updated_at: now(),
    })
  })
}

function cloneNodesFromTemplate(templateId: number, targetVersionId: number) {
  const sourceNodes = pageNodes.filter((node) => node.template_id === templateId)
  const idMap = new Map<number, number>()

  sourceNodes.forEach((node) => {
    idMap.set(node.id, nextNumericId(pageNodes) + idMap.size)
  })

  sourceNodes.forEach((node) => {
    const newId = idMap.get(node.id)
    if (!newId) {
      return
    }
    pageNodes.push({
      ...node,
      id: newId,
      page_version_id: targetVersionId,
      template_id: null,
      fragment_id: null,
      parent_id: node.parent_id === null ? null : (idMap.get(node.parent_id) ?? null),
      depth: node.depth,
      created_at: now(),
      updated_at: now(),
    })
  })
}

export async function listPageVersions(pageId: number, query: PageVersionQuery = {}): Promise<ListResult<PageVersion>> {
  const items = pageVersions
    .filter((item) => item.page_id === pageId)
    .filter((item) => includesQueryValue(item, query))
  return mockResolve(buildListResult(items))
}

export async function getPageVersion(id: number): Promise<PageVersion | undefined> {
  return mockResolve(pageVersions.find((item) => item.id === id))
}

export async function createPageVersion(pageId: number, payload: CreatePageVersionPayload): Promise<PageVersion> {
  const item = createVersionRecord(pageId, {
    version_name: payload.version_name,
    source_type: payload.source_type,
    source_id: payload.source_id,
    remark: payload.remark,
  })

  if (payload.source_type === 'clone_version' && payload.source_id) {
    cloneNodesToVersion(payload.source_id, item.id)
  }

  return mockResolve(item)
}

export async function createPageVersionFromTemplate(
  pageId: number,
  payload: CreatePageVersionFromTemplatePayload,
): Promise<PageVersion> {
  // TODO: 后端正式实现时建议对“版本创建 + 模板节点复制”采用事务回滚。
  const item = createVersionRecord(pageId, {
    version_name: payload.version_name,
    source_type: 'template',
    source_id: payload.template_id,
    remark: payload.remark,
  })

  cloneNodesFromTemplate(payload.template_id, item.id)
  return mockResolve(item)
}

export async function deletePageVersion(id: number): Promise<IdResponse | undefined> {
  const index = pageVersions.findIndex((item) => item.id === id && item.status !== 'published')
  if (index === -1) {
    return mockResolve(undefined)
  }
  pageVersions.splice(index, 1)
  return mockResolve({ id })
}

export async function publishPageVersion(id: number): Promise<PublishPageVersionResponse | undefined> {
  const version = pageVersions.find((item) => item.id === id)
  if (!version) {
    return mockResolve(undefined)
  }

  pageVersions.forEach((item) => {
    if (item.page_id === version.page_id && item.status === 'published') {
      item.status = 'archived'
      item.updated_at = now()
    }
  })

  version.status = 'published'
  version.updated_at = now()

  const page = pages.find((item) => item.id === version.page_id)
  if (!page) {
    return mockResolve(undefined)
  }

  page.current_version_id = version.id
  page.updated_at = now()

  return mockResolve({
    page: {
      id: page.id,
      current_version_id: page.current_version_id,
    },
    page_version: version,
  })
}

export async function lockPageVersion(id: number): Promise<PageVersion | undefined> {
  const version = pageVersions.find((item) => item.id === id)
  if (!version) {
    return mockResolve(undefined)
  }
  version.is_locked = true
  version.updated_at = now()
  return mockResolve(version)
}

export async function unlockPageVersion(id: number): Promise<PageVersion | undefined> {
  const version = pageVersions.find((item) => item.id === id)
  if (!version) {
    return mockResolve(undefined)
  }
  version.is_locked = false
  version.updated_at = now()
  return mockResolve(version)
}

export async function setPageVersionLock(id: number, isLocked: boolean): Promise<PageVersion | undefined> {
  return isLocked ? lockPageVersion(id) : unlockPageVersion(id)
}

export async function clonePageVersion(
  id: number,
  payload?: Partial<ClonePageVersionPayload>,
): Promise<PageVersion | undefined> {
  const version = pageVersions.find((item) => item.id === id)
  if (!version) {
    return mockResolve(undefined)
  }

  return createPageVersion(version.page_id, {
    version_name: payload?.version_name ?? `${version.version_name ?? '版本'}副本`,
    source_type: 'clone_version',
    source_id: version.id,
    remark: payload?.remark ?? version.remark,
  })
}

export async function getTemplateSourcePreview(templateId: number) {
  return getTemplateNodeTree(templateId)
}
