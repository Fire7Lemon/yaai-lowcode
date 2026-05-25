<script setup lang="ts">
import { computed } from 'vue'

import type { PageNode, UpdatePageNodeInput } from '@/types/page-node'
import { PAGE_NODE_TYPE_OPTIONS } from '@/constants/component'
import { YAAI_OFFICIAL_COMPONENT_KEYS, isYaaichannelOfficialComponentKey } from '@/constants/yaaichannel-component-keys'

const props = defineProps<{
  node: PageNode
}>()

const emit = defineEmits<{
  patch: [payload: UpdatePageNodeInput]
}>()

const whitelistHintKeys = YAAI_OFFICIAL_COMPONENT_KEYS.join(', ')

const showNonOfficialWarn = computed(
  () =>
    props.node.node_type !== 'fragment_ref' &&
    Boolean(props.node.component_key?.trim()) &&
    !isYaaichannelOfficialComponentKey(props.node.component_key ?? ''),
)
</script>

<template>
  <el-form label-width="92px">
    <el-form-item label="节点名称">
      <el-input :model-value="node.node_name ?? ''" @update:model-value="emit('patch', { node_name: $event })" />
    </el-form-item>
    <el-form-item label="节点类型">
      <el-select :model-value="node.node_type" @change="emit('patch', { node_type: $event })">
        <el-option v-for="item in PAGE_NODE_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
      </el-select>
    </el-form-item>
    <el-form-item label="组件键（component_key）">
      <el-input
        :model-value="node.component_key ?? ''"
        placeholder="推荐使用白名单 key，如 hero_banner"
        :disabled="node.node_type === 'fragment_ref'"
        @update:model-value="emit('patch', { component_key: $event || null })"
      />
      <el-alert
        class="property-panel__field-alert node-basic-form__tiny-alert"
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>YAAI 推荐区块键（含根容器）</template>
        <span>{{ whitelistHintKeys }}</span>
      </el-alert>
      <el-alert
        v-if="showNonOfficialWarn"
        class="property-panel__field-alert node-basic-form__tiny-alert"
        type="warning"
        :closable="false"
        show-icon
        title="该键不在前台正式白名单中，发布后可能落入 UnknownComponent，请确认。"
      />
    </el-form-item>
    <el-form-item label="slot_name">
      <div class="node-basic-form__slot-name-block">
        <el-input :model-value="node.slot_name ?? ''" disabled placeholder="通过左侧树移动节点调整插槽" />
        <el-alert
          class="property-panel__field-alert"
          title="slot_name 属于结构性字段，第一版统一通过 move 接口调整，不在单节点 update 中提交。"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
    </el-form-item>
    <el-form-item label="状态">
      <el-switch :model-value="node.status" @change="emit('patch', { status: $event as boolean })" />
    </el-form-item>
    <el-form-item label="备注">
      <el-input
        type="textarea"
        :rows="3"
        :model-value="node.remark ?? ''"
        @update:model-value="emit('patch', { remark: $event || null })"
      />
    </el-form-item>
  </el-form>
</template>

<style scoped>
.el-form {
  width: 100%;
}

.el-form :deep(.el-form-item__content) {
  min-width: 0;
}

.node-basic-form__slot-name-block {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.property-panel__field-alert {
  position: static;
  width: 100%;
  margin-top: 8px;
  box-sizing: border-box;
  line-height: 1.5;
  z-index: auto;
}

.property-panel__field-alert :deep(.el-alert__content) {
  min-width: 0;
}

.property-panel__field-alert :deep(.el-alert__title) {
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
}

.node-basic-form__tiny-alert {
  margin-top: 8px;
}
</style>
