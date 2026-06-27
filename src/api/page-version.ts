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

import { requestJson, shouldUseRealApi } from './http-client'
import { getTemplateNodeTree } from './page-template'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'
import { getErrorMessageFromResponse } from './response-utils'

export const pageVersionApiDrafts = {
  list: apiDraftMeta('/pages/{pageId}/versions', 'GET', true),
  detail: apiDraftMeta('/pages/{pageId}/versions/{id}', 'GET', true),
  create: apiDraftMeta('/pages/{pageId}/versions', 'POST', true),
  remove: apiDraftMeta('/pages/{pageId}/versions/{id}', 'DELETE', true, '仅允许删除未发布版本（后端约束）'),
  createFromTemplate: apiDraftMeta('/pages/{pageId}/versions/from-template', 'POST', true),
  publish: apiDraftMeta('/pages/{pageId}/versions/{id}/publish', 'POST', true),
  lock: apiDraftMeta('/pages/{pageId}/versions/{id}/lock', 'POST', true),
  unlock: apiDraftMeta('/pages/{pageId}/versions/{id}/unlock', 'POST', true),
  clone: apiDraftMeta('/pages/{pageId}/versions/{id}/clone', 'POST', true),
}

type Envelope<T> = {
  code?: string
  success?: boolean
  message?: string
  data?: T
}

function now() {
  return new Date().toISOString()
}

function createVersionRecord(
  pageId: number,
  payload: {
    version_name: string | null
    source_type: PageVersion['source_type']
    source_id: number | null
    remark: string | null
  },
): PageVersion {
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

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
  }
  return false
}

function mapPageVersion(raw: unknown): PageVersion {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    page_id: Number(item.page_id ?? item.pageId ?? 0),
    version_no: Number(item.version_no ?? item.versionNo ?? 0),
    version_name: toNullableString(item.version_name ?? item.versionName),
    source_type: (toNullableString(item.source_type ?? item.sourceType) ?? 'manual') as PageVersion['source_type'],
    source_id: toNullableNumber(item.source_id ?? item.sourceId),
    status: String(item.status ?? 'draft') as PageVersion['status'],
    is_locked: toBoolean(item.is_locked ?? item.isLocked),
    remark: toNullableString(item.remark),
    created_by: toNullableString(item.created_by ?? item.createdBy),
    created_at: String(item.created_at ?? item.createdAt ?? ''),
    updated_at: String(item.updated_at ?? item.updatedAt ?? ''),
  }
}

function throwIfEnvelopeFailed(raw: unknown, fallbackMessage: string): void {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return
  }
  const envelope = raw as Record<string, unknown>
  if (envelope.success === false) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackMessage)
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function pickVersionRowsAndTotal(container: Record<string, unknown>): { rows: unknown[]; total: number } | null {
  if (Array.isArray(container.records)) {
    const rows = container.records
    return { rows, total: Number(container.total ?? rows.length) }
  }
  if (Array.isArray(container.items)) {
    const rows = container.items
    return { rows, total: Number(container.total ?? rows.length) }
  }
  return null
}

function extractPageVersionListPayload(raw: unknown): ListResult<PageVersion> {
  throwIfEnvelopeFailed(raw, 'listPageVersions request failed')

  if (Array.isArray(raw)) {
    return {
      items: raw.map((row) => mapPageVersion(row)),
      total: raw.length,
    }
  }

  if (!raw || typeof raw !== 'object') {
    return { items: [], total: 0 }
  }

  const root = raw as Record<string, unknown>
  let picked = pickVersionRowsAndTotal(root)
  let page: number | undefined
  let page_size: number | undefined

  if (picked) {
    page = toNumber(root.page ?? root.current) ?? undefined
    page_size = toNumber(root.page_size ?? root.size) ?? undefined
  } else {
    const data = root.data
    if (data && typeof data === 'object' && !Array.isArray(data) && data !== null) {
      const dataObj = data as Record<string, unknown>
      picked = pickVersionRowsAndTotal(dataObj)
      if (picked) {
        page = toNumber(dataObj.page ?? dataObj.current) ?? undefined
        page_size = toNumber(dataObj.page_size ?? dataObj.size) ?? undefined
      }
    }
  }

  if (!picked) {
    return { items: [], total: 0 }
  }

  return {
    items: picked.rows.map((row) => mapPageVersion(row)),
    total: picked.total,
    page,
    page_size,
  }
}

function extractPageVersionDetailPayload(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) {
    throw new Error('pageVersion response is empty')
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('invalid pageVersion response shape')
  }
  const obj = raw as Record<string, unknown>
  if (obj.success === false) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'pageVersion request failed')
  }
  const data = obj.data
  if (data !== undefined && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const record = data as Record<string, unknown>
    if ('id' in record) {
      return record
    }
  }
  if ('id' in obj) {
    return obj
  }
  throw new Error('pageVersion response missing detail payload')
}

function buildPageVersionQueryParams(query: PageVersionQuery): string {
  const search = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ''
}

function buildCreatePageVersionRequestBody(payload: CreatePageVersionPayload): Record<string, unknown> {
  return {
    versionName: payload.version_name,
    sourceType: payload.source_type ?? 'manual',
    sourceId: payload.source_id,
    remark: payload.remark,
  }
}

function extractDeletePageVersionId(raw: unknown, requestedId: number): number {
  throwIfEnvelopeFailed(raw, 'deletePageVersion request failed')
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return requestedId
  }
  const root = raw as Record<string, unknown>
  const data = root.data
  if (typeof data === 'number' && Number.isFinite(data)) {
    return data
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const nestedId = (data as Record<string, unknown>).id
    if (typeof nestedId === 'number' && Number.isFinite(nestedId)) {
      return nestedId
    }
  }
  return requestedId
}

function mapPublishPageVersionResponse(raw: unknown): PublishPageVersionResponse {
  throwIfEnvelopeFailed(raw, 'publishPageVersion request failed')
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('publishPageVersion response is empty')
  }
  const root = raw as Record<string, unknown>
  const data = (root.data ?? root) as Record<string, unknown>
  const pageRaw = (data.page ?? {}) as Record<string, unknown>
  const versionRaw = data.page_version ?? data.pageVersion
  if (!versionRaw) {
    throw new Error('publishPageVersion response missing page_version payload')
  }
  return {
    page: {
      id: Number(pageRaw.id ?? 0),
      current_version_id: toNullableNumber(pageRaw.current_version_id ?? pageRaw.currentVersionId),
    },
    page_version: mapPageVersion(versionRaw),
  }
}

function buildCloneQueryParams(payload?: Partial<ClonePageVersionPayload>): string {
  const search = new URLSearchParams()
  if (payload?.version_name) {
    search.set('versionName', payload.version_name)
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export async function listPageVersions(pageId: number, query: PageVersionQuery = {}): Promise<ListResult<PageVersion>> {
  if (shouldUseRealApi()) {
    const raw = await requestJson<unknown>(`/pages/${pageId}/versions${buildPageVersionQueryParams(query)}`, {
      method: 'GET',
    })
    return extractPageVersionListPayload(raw)
  }

  const items = pageVersions
    .filter((item) => item.page_id === pageId)
    .filter((item) => includesQueryValue(item, query))
  return mockResolve(buildListResult(items))
}

export async function getPageVersion(pageId: number, id: number): Promise<PageVersion | undefined> {
  if (shouldUseRealApi()) {
    const raw = await requestJson<unknown>(`/pages/${pageId}/versions/${id}`, {
      method: 'GET',
    })
    throwIfEnvelopeFailed(raw, 'getPageVersion request failed')
    return mapPageVersion(extractPageVersionDetailPayload(raw))
  }

  const item = pageVersions.find((row) => row.id === id && row.page_id === pageId)
  return mockResolve(item)
}

export async function createPageVersion(pageId: number, payload: CreatePageVersionPayload): Promise<PageVersion> {
  if (shouldUseRealApi()) {
    if (payload.source_type === 'clone_version' && payload.source_id) {
      const cloned = await clonePageVersion(pageId, payload.source_id, {
        version_name: payload.version_name,
        remark: payload.remark,
      })
      if (!cloned) {
        throw new Error('clonePageVersion returned empty result')
      }
      return cloned
    }

    const raw = await requestJson<unknown>(`/pages/${pageId}/versions`, {
      method: 'POST',
      body: JSON.stringify(buildCreatePageVersionRequestBody(payload)),
    })
    throwIfEnvelopeFailed(raw, 'createPageVersion request failed')
    return mapPageVersion(extractPageVersionDetailPayload(raw))
  }

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
  if (shouldUseRealApi()) {
    const form = new URLSearchParams()
    form.set('templateId', String(payload.template_id))
    form.set('versionName', payload.version_name ?? '')
    form.set('remark', payload.remark ?? '')

    const raw = await requestJson<Envelope<unknown>>(`/pages/${pageId}/versions/from-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })

    throwIfEnvelopeFailed(raw, 'createPageVersionFromTemplate request failed')
    return mapPageVersion(extractPageVersionDetailPayload(raw))
  }

  const item = createVersionRecord(pageId, {
    version_name: payload.version_name,
    source_type: 'template',
    source_id: payload.template_id,
    remark: payload.remark,
  })

  cloneNodesFromTemplate(payload.template_id, item.id)
  return mockResolve(item)
}

export async function deletePageVersion(pageId: number, id: number): Promise<IdResponse | undefined> {
  if (shouldUseRealApi()) {
    const raw = await requestJson<unknown>(`/pages/${pageId}/versions/${id}`, {
      method: 'DELETE',
    })
    return { id: extractDeletePageVersionId(raw, id) }
  }

  const index = pageVersions.findIndex((item) => item.id === id && item.page_id === pageId && item.status !== 'published')
  if (index === -1) {
    return mockResolve(undefined)
  }
  pageVersions.splice(index, 1)
  return mockResolve({ id })
}

export async function publishPageVersion(pageId: number, id: number): Promise<PublishPageVersionResponse | undefined> {
  if (shouldUseRealApi()) {
    const raw = await requestJson<unknown>(`/pages/${pageId}/versions/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    return mapPublishPageVersionResponse(raw)
  }

  const version = pageVersions.find((item) => item.id === id && item.page_id === pageId)
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

export async function lockPageVersion(pageId: number, id: number): Promise<PageVersion | undefined> {
  if (shouldUseRealApi()) {
    const raw = await requestJson<unknown>(`/pages/${pageId}/versions/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    throwIfEnvelopeFailed(raw, 'lockPageVersion request failed')
    return mapPageVersion(extractPageVersionDetailPayload(raw))
  }

  const version = pageVersions.find((item) => item.id === id && item.page_id === pageId)
  if (!version) {
    return mockResolve(undefined)
  }
  version.is_locked = true
  version.updated_at = now()
  return mockResolve(version)
}

export async function unlockPageVersion(pageId: number, id: number): Promise<PageVersion | undefined> {
  if (shouldUseRealApi()) {
    const raw = await requestJson<unknown>(`/pages/${pageId}/versions/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    throwIfEnvelopeFailed(raw, 'unlockPageVersion request failed')
    return mapPageVersion(extractPageVersionDetailPayload(raw))
  }

  const version = pageVersions.find((item) => item.id === id && item.page_id === pageId)
  if (!version) {
    return mockResolve(undefined)
  }
  version.is_locked = false
  version.updated_at = now()
  return mockResolve(version)
}

export async function setPageVersionLock(
  pageId: number,
  id: number,
  isLocked: boolean,
): Promise<PageVersion | undefined> {
  return isLocked ? lockPageVersion(pageId, id) : unlockPageVersion(pageId, id)
}

export async function clonePageVersion(
  pageId: number,
  id: number,
  payload?: Partial<ClonePageVersionPayload>,
): Promise<PageVersion | undefined> {
  if (shouldUseRealApi()) {
    const raw = await requestJson<unknown>(
      `/pages/${pageId}/versions/${id}/clone${buildCloneQueryParams(payload)}`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    )
    throwIfEnvelopeFailed(raw, 'clonePageVersion request failed')
    return mapPageVersion(extractPageVersionDetailPayload(raw))
  }

  const version = pageVersions.find((item) => item.id === id && item.page_id === pageId)
  if (!version) {
    return mockResolve(undefined)
  }

  return createPageVersion(pageId, {
    version_name: payload?.version_name ?? `${version.version_name ?? '版本'}副本`,
    source_type: 'clone_version',
    source_id: version.id,
    remark: payload?.remark ?? version.remark,
  })
}

export async function getTemplateSourcePreview(templateId: number) {
  return getTemplateNodeTree(templateId)
}
