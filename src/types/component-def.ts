import type { ListQuery } from './api'

export interface ComponentDef {
  id: number
  component_key: string
  component_name: string
  component_group: string | null
  component_type: string | null
  icon: string | null
  is_container: boolean
  can_bind_data: boolean
  can_reuse_as_fragment: boolean
  prop_schema_json: string | null
  style_schema_json: string | null
  event_schema_json: string | null
  layout_schema_json: string | null
  allowed_child_types_json: string | null
  default_props_json: string | null
  default_style_json: string | null
  sort_order: number | null
  status: boolean
  remark: string | null
  created_at: string
  updated_at: string
}

export interface ComponentDefQuery extends ListQuery {
  component_name?: string
  component_group?: string
  component_type?: string
  status?: boolean
}

export interface ComponentDefCreateInput {
  component_key: string
  component_name: string
  component_group: string | null
  component_type: string | null
  icon: string | null
  is_container: boolean
  can_bind_data: boolean
  can_reuse_as_fragment: boolean
  prop_schema_json: string | null
  style_schema_json: string | null
  event_schema_json: string | null
  layout_schema_json: string | null
  allowed_child_types_json: string | null
  default_props_json: string | null
  default_style_json: string | null
  sort_order: number | null
  status: boolean
  remark: string | null
}

export type ComponentDefUpdateInput = ComponentDefCreateInput

export interface ComponentDefStatusInput {
  status: boolean
}
