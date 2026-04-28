import { pages, pageVersions } from '@/mock/database'
import type { ListResult } from '@/types/api'
import type { Page, PageCreateInput, PageQuery, PageUpdateInput } from '@/types/page'
import type { PageVersion } from '@/types/page-version'

import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'

export const pageApiDrafts = {
  list: apiDraftMeta('/pages', 'GET', false, 'TODO: 分页参数与排序字段待后端确认'),
  detail: apiDraftMeta('/pages/{id}', 'GET', true),
  create: apiDraftMeta('/pages', 'POST', true),
  update: apiDraftMeta('/pages/{id}', 'PUT', true),
  remove: apiDraftMeta('/pages/{id}', 'DELETE', false, 'TODO: 删除已有版本页面时的约束策略待确认'),
  currentVersion: apiDraftMeta('/pages/{id}/current-version', 'GET', false, 'TODO: 未发布时返回 null 还是 404 待确认'),
}

export async function listPages(query: PageQuery = {}): Promise<ListResult<Page>> {
  return mockResolve(buildListResult(pages.filter((item) => includesQueryValue(item, query))))
}

export async function getPage(id: number): Promise<Page | undefined> {
  return mockResolve(pages.find((item) => item.id === id))
}

export async function createPage(payload: PageCreateInput): Promise<Page> {
  const item: Page = {
    ...payload,
    id: nextNumericId(pages),
    current_version_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  pages.push(item)
  return mockResolve(item)
}

export async function updatePage(id: number, payload: PageUpdateInput): Promise<Page | undefined> {
  const index = pages.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  pages[index] = {
    ...pages[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(pages[index])
}

export async function deletePage(id: number): Promise<{ id: number } | undefined> {
  const index = pages.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  pages.splice(index, 1)
  return mockResolve({ id })
}

export async function getPageCurrentVersion(id: number): Promise<PageVersion | null> {
  const page = pages.find((item) => item.id === id)
  return mockResolve(pageVersions.find((item) => item.id === page?.current_version_id) ?? null)
}
