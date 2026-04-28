<script setup lang="ts">
import type { PageNode, UpdatePageNodeInput } from '@/types/page-node'

defineProps<{
  node: PageNode
}>()

const emit = defineEmits<{
  patch: [payload: UpdatePageNodeInput]
}>()
</script>

<template>
  <el-form label-width="92px">
    <el-form-item label="排序">
      <el-input-number :model-value="node.sort_order ?? 0" disabled />
    </el-form-item>
    <el-form-item label="深度">
      <el-input-number :model-value="node.depth ?? 0" disabled />
    </el-form-item>
    <el-form-item label="列占比">
      <el-input-number :model-value="node.col_span ?? 1" @change="emit('patch', { col_span: Number($event) })" />
    </el-form-item>
    <el-form-item label="行占比">
      <el-input-number :model-value="node.row_span ?? 1" @change="emit('patch', { row_span: Number($event) })" />
    </el-form-item>
    <el-alert
      title="sort_order 为结构性字段，第一版统一通过 move 接口调整；depth 由后端校正。"
      type="info"
      :closable="false"
    />
  </el-form>
</template>
