<script setup lang="ts">
defineProps<{
  saving?: boolean
  hasSelection?: boolean
}>()

const emit = defineEmits<{
  refresh: []
  addContainer: []
  addComponent: []
  addFragment: []
  copySelected: []
  save: []
}>()
</script>

<template>
  <div class="toolbar">
    <div class="app-toolbar__group">
      <el-button type="primary" plain @click="emit('addContainer')">新增容器</el-button>
      <el-button type="primary" plain @click="emit('addComponent')">新增组件</el-button>
      <el-button plain @click="emit('addFragment')">引用片段</el-button>
    </div>
    <div class="app-toolbar__group toolbar__secondary">
      <el-button plain :disabled="!hasSelection" @click="emit('copySelected')">复制选中</el-button>
      <el-button plain @click="emit('refresh')">刷新</el-button>
    </div>
    <div class="app-toolbar__spacer" />
    <div class="app-toolbar__group">
      <el-button type="primary" :loading="saving" @click="emit('save')">保存整棵树</el-button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.92));
  box-shadow: var(--app-shadow-sm);
}

.toolbar__secondary {
  padding-left: 8px;
  border-left: 1px solid var(--app-border);
}
</style>
