<script setup lang="ts">
import { computed } from 'vue'

import { formatJsonText } from '@/utils/json'
import { schemaSummary } from '@/utils/schema'

const props = defineProps<{
  title: string
  value: string | null
}>()

const summary = computed(() => schemaSummary(props.value))
const content = computed(() => formatJsonText(props.value))
</script>

<template>
  <el-card shadow="never" class="app-card schema-panel">
    <template #header>
      <div class="schema-panel__header">
        <div class="schema-panel__title-group">
          <div class="schema-panel__title">{{ title }}</div>
          <p class="schema-panel__description">辅助理解当前 Schema 内容，不替代主表单编辑。</p>
        </div>
        <el-tag size="small" type="info">{{ summary }}</el-tag>
      </div>
    </template>
    <pre class="schema-panel__content">{{ content || '未配置' }}</pre>
  </el-card>
</template>

<style scoped>
.schema-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.schema-panel__title-group {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.schema-panel__title {
  color: var(--app-text);
  font-size: 15px;
  font-weight: 700;
}

.schema-panel__description {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.schema-panel__content {
  margin: 0;
  padding: 14px 16px;
  border: 1px solid rgba(219, 229, 240, 0.9);
  border-radius: 14px;
  background: rgba(248, 251, 255, 0.78);
  white-space: pre-wrap;
  word-break: break-word;
  color: #334155;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
}
</style>
