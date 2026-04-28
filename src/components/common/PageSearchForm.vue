<script setup lang="ts">
defineProps<{
  title?: string
}>()

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>

<template>
  <el-card shadow="never" class="app-card search-form-card">
    <div class="search-form">
      <div class="search-form__header">
        <div>
          <div class="search-form__title">{{ title ?? '筛选条件' }}</div>
          <div class="search-form__description">优先缩短筛选路径，减少进入列表主体前的视觉停留。</div>
        </div>
        <div class="app-toolbar search-form__actions">
          <el-button type="primary" @click="emit('search')">查询</el-button>
          <el-button @click="emit('reset')">重置</el-button>
        </div>
      </div>
      <el-form label-width="88px" inline class="search-form__body">
        <slot />
      </el-form>
    </div>
  </el-card>
</template>

<style scoped>
.search-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-form__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.search-form__title {
  font-size: 15px;
  color: var(--app-text);
  font-weight: 700;
}

.search-form__description {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.search-form__actions {
  flex: 0 0 auto;
}

.search-form__body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 14px;
}

.search-form__body :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

.search-form__body :deep(.el-input),
.search-form__body :deep(.el-select) {
  width: 100%;
}

@media (max-width: 960px) {
  .search-form__header {
    flex-direction: column;
  }
}
</style>
