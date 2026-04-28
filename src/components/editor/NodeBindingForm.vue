<script setup lang="ts">
import { onMounted, watch } from 'vue'

import FragmentReferencePicker from './FragmentReferencePicker.vue'

import type { PageNode, UpdatePageNodeInput } from '@/types/page-node'
import { useDataBindingStore } from '@/stores/data-binding'

const props = defineProps<{
  node: PageNode
}>()

const emit = defineEmits<{
  patch: [payload: UpdatePageNodeInput]
}>()

const bindingStore = useDataBindingStore()

onMounted(async () => {
  await bindingStore.load()
})

watch(
  () => props.node.data_binding_id,
  async (value) => {
    await bindingStore.loadPreview(value)
  },
  { immediate: true },
)
</script>

<template>
  <div class="binding-form">
    <el-form label-width="92px">
      <el-form-item label="绑定配置">
        <el-select
          :model-value="node.data_binding_id ?? undefined"
          clearable
          placeholder="请选择数据绑定"
          @change="emit('patch', { data_binding_id: ($event as number | undefined) ?? null })"
        >
          <el-option v-for="item in bindingStore.items" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="node.node_type === 'fragment_ref'" label="引用片段">
        <FragmentReferencePicker
          :model-value="node.ref_fragment_id"
          @update:model-value="emit('patch', { ref_fragment_id: $event })"
        />
      </el-form-item>
    </el-form>
    <el-alert
      v-if="node.node_type === 'fragment_ref'"
      title="片段引用节点仍是标准 page_node，仅通过 ref_fragment_id 指向 reusable_fragment。"
      type="warning"
      :closable="false"
    />
    <el-alert title="绑定预览为接口草案占位能力" type="info" :closable="false" />
    <pre class="binding-form__preview">{{ JSON.stringify(bindingStore.previewItems, null, 2) }}</pre>
  </div>
</template>

<style scoped>
.binding-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.binding-form__preview {
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-subtle);
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.binding-form :deep(.el-alert) {
  border-radius: 12px;
}
</style>
