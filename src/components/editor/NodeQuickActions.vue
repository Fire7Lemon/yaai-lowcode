<script setup lang="ts">
import { CopyDocument, Delete, Link } from '@element-plus/icons-vue'

defineProps<{
  canReplaceFragment?: boolean
}>()

const emit = defineEmits<{
  copy: []
  remove: []
  replaceFragment: []
}>()
</script>

<template>
  <div class="quick-actions" @click.stop>
    <el-tooltip content="复制节点" placement="top">
      <el-button size="small" text class="quick-actions__button" @click="emit('copy')">
        <el-icon><CopyDocument /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip v-if="canReplaceFragment" content="更换片段" placement="top">
      <el-button size="small" text class="quick-actions__button" @click="emit('replaceFragment')">
        <el-icon><Link /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip content="删除节点" placement="top">
      <el-button size="small" text type="danger" class="quick-actions__button" @click="emit('remove')">
        <el-icon><Delete /></el-icon>
      </el-button>
    </el-tooltip>
  </div>
</template>

<style scoped>
.quick-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  border: 1px solid rgba(203, 213, 225, 0.85);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
}

.quick-actions__button {
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 999px;
}

.quick-actions__button:hover {
  background: rgba(59, 130, 246, 0.08);
}

.quick-actions__button:disabled {
  opacity: 0.45;
}
</style>
