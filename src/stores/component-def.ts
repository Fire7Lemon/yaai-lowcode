import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

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
