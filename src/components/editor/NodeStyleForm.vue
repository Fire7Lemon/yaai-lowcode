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
    :model-value="node.style_json ?? ''"
    placeholder="请输入样式配置 JSON（style_json）"
    @update:model-value="emit('patch', { style_json: $event || null })"
  />
</template>
