import type { ComponentDef } from '@/types/component-def'
import type { PageNode, PageNodeTreeWriteItem, SavePageNodeTreePayload } from '@/types/page-node'

const VALID_NODE_TYPES = new Set(['container', 'component', 'fragment_ref'])

export function buildSavePageNodeTreePayload(nodes: PageNode[]): SavePageNodeTreePayload {
  return {
    nodes: nodes.map<PageNodeTreeWriteItem>((node) => ({
      id: node.id,
      page_version_id: node.page_version_id,
      template_id: node.template_id,
      fragment_id: node.fragment_id,
      parent_id: node.parent_id,
      node_type: node.node_type,
      component_key: node.component_key,
      node_name: node.node_name,
      slot_name: node.slot_name,
      sort_order: node.sort_order,
      col_span: node.col_span,
      row_span: node.row_span,
      data_binding_id: node.data_binding_id,
      ref_fragment_id: node.ref_fragment_id,
      props_json: node.props_json,
      style_json: node.style_json,
      layout_json: node.layout_json,
      event_json: node.event_json,
      visible_rule_json: node.visible_rule_json,
      status: node.status,
      remark: node.remark,
    })),
  }
}

export function validatePageNodeTree(nodes: PageNode[], componentDefs: ComponentDef[]): string[] {
  const errors: string[] = []

  if (!nodes.length) {
    errors.push('节点树不能为空。')
    return errors
  }

  if (!nodes.some((node) => node.parent_id === null)) {
    errors.push('至少需要一个根节点。')
  }

  const nodeIds = new Set(nodes.map((node) => node.id))
  const componentKeys = new Set(componentDefs.map((item) => item.component_key))

  nodes.forEach((node) => {
    const label = node.node_name || `节点#${node.id}`

    if (!VALID_NODE_TYPES.has(node.node_type)) {
      errors.push(`${label} 的 node_type 非法。`)
    }

    if (node.parent_id !== null && !nodeIds.has(node.parent_id)) {
      errors.push(`${label} 的 parent_id 指向不存在的节点。`)
    }

    if (node.node_type === 'fragment_ref') {
      if (!node.ref_fragment_id) {
        errors.push(`${label} 为片段引用节点，但缺少 ref_fragment_id。`)
      }
      return
    }

    if (!node.component_key) {
      errors.push(`${label} 缺少 component_key。`)
      return
    }

    if (!componentKeys.has(node.component_key)) {
      errors.push(`${label} 的 component_key 不存在于 component_def。`)
    }
  })

  return errors
}
