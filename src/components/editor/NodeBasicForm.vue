<script setup lang="ts">
import type { PageNode, UpdatePageNodeInput } from '@/types/page-node'
import { PAGE_NODE_TYPE_OPTIONS } from '@/constants/component'

defineProps<{
  node: PageNode
}>()

const emit = defineEmits<{
  patch: [payload: UpdatePageNodeInput]
}>()
</script>

<template>
  <el-form label-width="92px">
    <el-form-item label="节点名称">
      <el-input :model-value="node.node_name ?? ''" @update:model-value="emit('patch', { node_name: $event })" />
    </el-form-item>
    <el-form-item label="节点类型">
      <el-select :model-value="node.node_type" @change="emit('patch', { node_type: $event })">
        <el-option v-for="item in PAGE_NODE_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
      </el-select>
    </el-form-item>
    <el-form-item label="组件 Key">
      <el-input
        :model-value="node.component_key ?? ''"
        :disabled="node.node_type === 'fragment_ref'"
        @update:model-value="emit('patch', { component_key: $event || null })"
      />
    </el-form-item>
    <el-alert
      title="slot_name 属于结构性字段，第一版统一通过 move 接口调整，不在单节点 update 中提交。"
      type="info"
      :closable="false"
    />
    <el-form-item label="状态">
      <el-switch :model-value="node.status" @change="emit('patch', { status: $event as boolean })" />
    </el-form-item>
    <el-form-item label="备注">
      <el-input
        type="textarea"
        :rows="3"
        :model-value="node.remark ?? ''"
        @update:model-value="emit('patch', { remark: $event || null })"
      />
    </el-form-item>
  </el-form>
</template>
