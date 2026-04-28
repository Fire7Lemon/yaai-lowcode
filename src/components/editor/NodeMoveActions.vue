<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'

const ROOT_VALUE = '__root__'

const props = defineProps<{
  canMoveUp: boolean
  canMoveDown: boolean
  parentOptions: Array<{ label: string; value: number | null }>
  currentParentId: number | null
  slotOptions: string[]
  currentSlotName: string | null
}>()

const emit = defineEmits<{
  moveUp: []
  moveDown: []
  changeParent: [parentId: number | null]
  changeSlot: [slotName: string | null]
}>()

const parentValue = computed(() => props.currentParentId ?? ROOT_VALUE)
const slotValue = computed(() => props.currentSlotName ?? 'main')

function handleParentChange(value: string | number) {
  emit('changeParent', value === ROOT_VALUE ? null : Number(value))
}
</script>

<template>
  <div class="node-move-actions" @click.stop>
    <el-button-group class="node-move-actions__group">
      <el-tooltip content="上移" placement="top">
        <el-button size="small" text :disabled="!canMoveUp" class="node-move-actions__icon" @click="emit('moveUp')">
          <el-icon><ArrowUp /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="下移" placement="top">
        <el-button
          size="small"
          text
          :disabled="!canMoveDown"
          class="node-move-actions__icon"
          @click="emit('moveDown')"
        >
          <el-icon><ArrowDown /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>
    <div class="node-move-actions__field">
      <span class="node-move-actions__label">父级</span>
      <el-select
        :model-value="parentValue"
        size="small"
        class="node-move-actions__select"
        @change="handleParentChange"
      >
        <el-option :value="ROOT_VALUE" label="设为根节点" />
        <el-option
          v-for="item in parentOptions"
          :key="String(item.value)"
          :label="item.label"
          :value="item.value ?? ROOT_VALUE"
        />
      </el-select>
    </div>
    <div class="node-move-actions__field">
      <span class="node-move-actions__label">slot</span>
      <el-select
        :model-value="slotValue"
        size="small"
        class="node-move-actions__select node-move-actions__select--slot"
        @change="emit('changeSlot', $event as string)"
      >
        <el-option v-for="slot in slotOptions" :key="slot" :label="slot" :value="slot" />
      </el-select>
    </div>
  </div>
</template>

<style scoped>
.node-move-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.node-move-actions__group {
  overflow: hidden;
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
}

.node-move-actions__icon {
  width: 26px;
  height: 26px;
  padding: 0;
}

.node-move-actions__icon:disabled {
  opacity: 0.4;
}

.node-move-actions__field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
}

.node-move-actions__label {
  color: var(--app-text-muted);
  font-size: 11px;
  white-space: nowrap;
}

.node-move-actions__select {
  width: 92px;
}

.node-move-actions__select--slot {
  width: 72px;
}

.node-move-actions__field :deep(.el-select__wrapper) {
  min-height: 24px;
  padding-left: 2px;
  padding-right: 4px;
  box-shadow: none;
  background: transparent;
}
</style>
