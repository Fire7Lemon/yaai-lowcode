import type { ListQuery } from './api'

export interface PageTemplate {
  id: number
  name: string
  code: string
  scene_type: string | null
  preview_image: string | null
  description: string | null
  status: boolean
  remark: string | null
  created_at: string
  updated_at: string
}

export interface PageTemplateQuery extends ListQuery {
  name?: string
  code?: string
  scene_type?: string
  status?: boolean
}

export interface PageTemplateCreateInput {
  name: string
  code: string
  scene_type: string | null
  preview_image: string | null
  description: string | null
  status: boolean
  remark: string | null
}

export type PageTemplateUpdateInput = PageTemplateCreateInput
