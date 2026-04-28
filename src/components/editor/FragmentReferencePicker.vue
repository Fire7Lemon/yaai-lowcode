<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { listReusableFragments } from '@/api/reusable-fragment'
import type { ReusableFragment } from '@/types/reusable-fragment'

const model = defineModel<number | null>({ required: true })

const items = ref<ReusableFragment[]>([])

onMounted(async () => {
  const result = await listReusableFragments()
  items.value = result.items
})
</script>

<template>
  <el-select v-model="model" placeholder="请选择片段" clearable filterable style="width: 100%" class="fragment-picker">
    <el-option
      v-for="item in items"
      :key="item.id"
      :label="`${item.name} (${item.code})`"
      :value="item.id"
    >
      <div class="fragment-option">
        <div class="fragment-option__title">{{ item.name }}</div>
        <div class="fragment-option__meta">{{ item.code }} · {{ item.fragment_type || '未分类' }}</div>
        <div v-if="item.description" class="fragment-option__desc">{{ item.description }}</div>
      </div>
    </el-option>
  </el-select>
</template>

<style scoped>
.fragment-picker :deep(.el-select__wrapper) {
  min-height: 42px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(255, 255, 255, 1));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 1px 2px rgba(15, 23, 42, 0.02);
}

.fragment-option :deep(*) {
  line-height: inherit;
}

.fragment-option {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 0;
  line-height: 1.4;
}

.fragment-option__title {
  color: #111827;
}

.fragment-option__meta,
.fragment-option__desc {
  font-size: 12px;
  color: #6b7280;
}
</style>
