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
    :model-value="node.event_json ?? ''"
    placeholder="请输入 event_json"
    @update:model-value="emit('patch', { event_json: $event || null })"
  />
</template>
