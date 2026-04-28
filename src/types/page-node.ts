import type { NodeCollectionResponse } from './api'
import type { ReusableFragment } from './reusable-fragment'
import type { PageTemplate } from './page-template'
import type { PageVersion } from './page-version'

export type PageNodeType = 'container' | 'component' | 'fragment_ref'

export interface PageNode {
  id: number
  page_version_id: number | null
  template_id: number | null
  fragment_id: number | null
  parent_id: number | null
  node_type: PageNodeType
  component_key: string | null
  node_name: string | null
  slot_name: string | null
  sort_order: number | null
  depth: number | null
  col_span: number | null
  row_span: number | null
  data_binding_id: number | null
  ref_fragment_id: number | null
  props_json: string | null
  style_json: string | null
  layout_json: string | null
  event_json: string | null
  visible_rule_json: string | null
  status: boolean
  remark: string | null
  created_at: string
  updated_at: string
}

export interface PageVersionNodeTreeResponse {
  page_version: PageVersion
  nodes: PageNode[]
}

export interface PageTemplateNodeTreeResponse {
  template: PageTemplate
  nodes: PageNode[]
}

export interface ReusableFragmentNodeTreeResponse {
  fragment: ReusableFragment
  nodes: PageNode[]
}

export interface PageNodeTreeWriteItem {
  id: number | null
  page_version_id: number | null
  template_id: number | null
  fragment_id: number | null
  parent_id: number | null
  node_type: PageNodeType
  component_key: string | null
  node_name: string | null
  slot_name: string | null
  sort_order: number | null
  col_span: number | null
  row_span: number | null
  data_binding_id: number | null
  ref_fragment_id: number | null
  props_json: string | null
  style_json: string | null
  layout_json: string | null
  event_json: string | null
  visible_rule_json: string | null
  status: boolean
  remark: string | null
}

export interface SavePageNodeTreePayload extends NodeCollectionResponse<PageNodeTreeWriteItem> {}

export interface CreatePageNodeInput {
  parent_id: number | null
  node_type: PageNodeType
  component_key: string | null
  node_name: string | null
  slot_name: string | null
  sort_order: number | null
  col_span: number | null
  row_span: number | null
  data_binding_id: number | null
  ref_fragment_id: number | null
  props_json: string | null
  style_json: string | null
  layout_json: string | null
  event_json: string | null
  visible_rule_json: string | null
  status: boolean
  remark: string | null
}

// TODO: v1 已确认 parent_id / slot_name / sort_order 的结构性变更统一走 move，update 不负责结构移动。
export interface UpdatePageNodeInput {
  node_type?: PageNodeType
  component_key?: string | null
  node_name?: string | null
  col_span?: number | null
  row_span?: number | null
  data_binding_id?: number | null
  ref_fragment_id?: number | null
  props_json?: string | null
  style_json?: string | null
  layout_json?: string | null
  event_json?: string | null
  visible_rule_json?: string | null
  status?: boolean
  remark?: string | null
}

export interface MovePageNodeInput {
  parent_id: number | null
  slot_name: string | null
  sort_order: number | null
}

export interface CopyPageNodeInput {
  parent_id: number | null
  slot_name: string | null
  sort_order: number | null
}

export interface ReferenceFragmentInput {
  ref_fragment_id: number
}
