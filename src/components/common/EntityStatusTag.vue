<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: boolean
  trueText?: string
  falseText?: string
}>()

const type = computed(() => (props.status ? 'success' : 'info'))
const label = computed(() => (props.status ? props.trueText ?? '启用' : props.falseText ?? '停用'))
</script>

<template>
  <el-tag :type="type">{{ label }}</el-tag>
</template>
