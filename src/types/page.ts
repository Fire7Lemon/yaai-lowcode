import type { ListQuery } from './api'

export interface Page {
  id: number
  name: string
  code: string
  path: string
  page_type: string
  title: string | null
  status: boolean
  current_version_id: number | null
  seo_title: string | null
  seo_keywords: string | null
  seo_description: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

export interface PageQuery extends ListQuery {
  name?: string
  code?: string
  path?: string
  page_type?: string
  title?: string
  status?: boolean
  current_version_id?: number
}

export interface PageCreateInput {
  name: string
  code: string
  path: string
  page_type: string
  title: string | null
  status: boolean
  seo_title: string | null
  seo_keywords: string | null
  seo_description: string | null
  remark: string | null
}

export type PageUpdateInput = PageCreateInput
