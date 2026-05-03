import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ElMessage } from 'element-plus'

import { listComponentDefs } from '@/api/component-def'
import type { ComponentDef } from '@/types/component-def'

export const useComponentDefStore = defineStore('component-def', () => {
  const items = ref<ComponentDef[]>([])
  const loading = ref(false)

  const enabledItems = computed(() => items.value.filter((item) => item.status))

  async function load() {
    loading.value = true
    try {
      const result = await listComponentDefs()
      items.value = result.items
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '组件定义列表加载失败')
      items.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    enabledItems,
    load,
  }
})
