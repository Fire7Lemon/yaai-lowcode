<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{
  rows?: number
  placeholder?: string
}>()
</script>

<template>
  <div class="json-editor">
    <div class="json-editor__label">JSON 配置</div>
    <el-input
      v-model="model"
      type="textarea"
      :rows="rows ?? 8"
      :placeholder="placeholder ?? '请输入 JSON 配置内容'"
      class="json-editor__input"
    />
  </div>
</template>

<style scoped>
.json-editor {
  position: relative;
}

.json-editor__label {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 1;
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.json-editor__input :deep(.el-textarea__inner) {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;
  padding: 36px 14px 14px;
  border-radius: 14px;
  border-color: var(--app-border);
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(255, 255, 255, 1));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.json-editor__input :deep(.el-textarea__inner:hover) {
  border-color: var(--app-border-strong);
}

.json-editor__input :deep(.el-textarea__inner:focus) {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px rgba(96, 165, 250, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
</style>
