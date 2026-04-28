import type { ListQuery } from './api'

export interface Menu {
  id: number
  parent_id: number | null
  name: string
  code: string
  url_type: 'page' | 'external'
  page_id: number | null
  external_url: string | null
  sort_order: number | null
  status: boolean
  icon: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

export interface MenuQuery extends ListQuery {
  name?: string
  code?: string
  url_type?: 'page' | 'external'
  status?: boolean
}

export interface MenuCreateInput {
  parent_id: number | null
  name: string
  code: string
  url_type: 'page' | 'external'
  page_id: number | null
  external_url: string | null
  sort_order: number | null
  status: boolean
  icon: string | null
  remark: string | null
}

export type MenuUpdateInput = MenuCreateInput

export interface MoveMenuInput {
  parent_id: number | null
  sort_order: number | null
}
