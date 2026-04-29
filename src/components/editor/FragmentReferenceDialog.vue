<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { ReusableFragment } from '@/types/reusable-fragment'

import FragmentReferencePicker from './FragmentReferencePicker.vue'

const props = defineProps<{
  modelValue: boolean
  currentFragmentId: number | null
  items: ReusableFragment[]
  title?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [fragmentId: number]
}>()

const draftFragmentId = ref<number | null>(props.currentFragmentId)

watch(
  () => [props.modelValue, props.currentFragmentId],
  () => {
    draftFragmentId.value = props.currentFragmentId
  },
  { immediate: true },
)

const currentFragment = computed(() =>
  props.items.find((item) => item.id === draftFragmentId.value) ?? null,
)

function handleConfirm() {
  if (!draftFragmentId.value) {
    return
  }
  emit('confirm', draftFragmentId.value)
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title ?? '选择可复用片段'"
    width="520px"
    class="fragment-reference-dialog"
    @close="emit('update:modelValue', false)"
  >
    <div class="fragment-dialog">
      <div class="fragment-dialog__intro">
        <div class="fragment-dialog__title">选择片段目标</div>
        <p class="fragment-dialog__description">创建或替换片段引用时，请先确认片段名称与编码，避免仅按 ID 操作。</p>
      </div>
      <FragmentReferencePicker v-model="draftFragmentId" />
      <el-empty v-if="!currentFragment" description="请选择一个可复用片段" :image-size="72" />
      <div v-else class="fragment-dialog__summary">
        <div class="fragment-dialog__summary-item">
          <span class="fragment-dialog__summary-label">片段名称</span>
          <span class="fragment-dialog__summary-value">{{ currentFragment.name }}</span>
        </div>
        <div class="fragment-dialog__summary-item">
          <span class="fragment-dialog__summary-label">片段编码</span>
          <span class="fragment-dialog__summary-value">{{ currentFragment.code }}</span>
        </div>
        <div class="fragment-dialog__summary-item">
          <span class="fragment-dialog__summary-label">片段类型</span>
          <span class="fragment-dialog__summary-value">{{ currentFragment.fragment_type || '-' }}</span>
        </div>
        <div class="fragment-dialog__summary-item">
          <span class="fragment-dialog__summary-label">说明</span>
          <span class="fragment-dialog__summary-value">{{ currentFragment.description || '-' }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!draftFragmentId" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.fragment-dialog {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.fragment-dialog__intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fragment-dialog__title {
  color: var(--app-text);
  font-size: 15px;
  font-weight: 700;
}

.fragment-dialog__description {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.fragment-dialog__summary {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
}

.fragment-dialog__summary-item {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 12px;
  align-items: start;
}

.fragment-dialog__summary-label {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.fragment-dialog__summary-value {
  color: var(--app-text);
  font-size: 13px;
  line-height: 1.6;
}

.fragment-reference-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.fragment-reference-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--app-border);
}

.fragment-reference-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.94));
}

.fragment-reference-dialog :deep(.el-dialog__footer) {
  padding: 0 24px 20px;
}
</style>
