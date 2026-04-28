import type { ListQuery } from './api'

export type PageVersionSourceType = 'manual' | 'template' | 'clone_version'
export type PageVersionStatus = 'draft' | 'published' | 'archived'

export interface PageVersion {
  id: number
  page_id: number
  version_no: number
  version_name: string | null
  source_type: PageVersionSourceType | null
  source_id: number | null
  status: PageVersionStatus
  is_locked: boolean
  remark: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PageVersionQuery extends ListQuery {
  status?: PageVersionStatus
  version_name?: string
  source_type?: PageVersionSourceType
  is_locked?: boolean
}

export interface CreatePageVersionPayload {
  version_name: string | null
  source_type: 'manual' | 'clone_version' | null
  source_id: number | null
  remark: string | null
}

export interface CreatePageVersionFromTemplatePayload {
  template_id: number
  version_name: string | null
  remark: string | null
}

export interface ClonePageVersionPayload {
  version_name: string | null
  remark: string | null
}

export interface PublishPageVersionResponse {
  page: {
    id: number
    current_version_id: number | null
  }
  page_version: PageVersion
}
