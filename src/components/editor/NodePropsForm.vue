<script setup lang="ts">
import JsonCodeEditor from '@/components/common/JsonCodeEditor.vue'
import type { PageNode, UpdatePageNodeInput } from '@/types/page-node'

defineProps<{
  node: PageNode
}>()

const emit = defineEmits<{
  patch: [payload: UpdatePageNodeInput]
}>()
</script>

<template>
  <JsonCodeEditor
    :model-value="node.props_json ?? ''"
    placeholder="请输入业务属性 JSON（props_json）"
    @update:model-value="emit('patch', { props_json: $event || null })"
  />
</template>
