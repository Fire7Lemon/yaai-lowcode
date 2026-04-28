import type { ListQuery } from './api'

export interface DataBinding {
  id: number
  name: string
  binding_type: string
  source_key: string
  query_json: string | null
  field_map_json: string | null
  transform_json: string | null
  empty_state_json: string | null
  error_state_json: string | null
  cache_policy: string | null
  status: boolean
  remark: string | null
  created_at: string
  updated_at: string
}

export interface DataBindingQuery extends ListQuery {
  name?: string
  binding_type?: string
  source_key?: string
  status?: boolean
}

export interface DataBindingCreateInput {
  name: string
  binding_type: string
  source_key: string
  query_json: string | null
  field_map_json: string | null
  transform_json: string | null
  empty_state_json: string | null
  error_state_json: string | null
  cache_policy: string | null
  status: boolean
  remark: string | null
}

export type DataBindingUpdateInput = DataBindingCreateInput

export interface DataBindingPreviewResponse {
  binding: DataBinding
  preview_data: unknown[]
}
