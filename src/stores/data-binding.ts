import { ref } from 'vue'
import { defineStore } from 'pinia'

import { listDataBindings, previewDataBinding } from '@/api/data-binding'
import type { DataBinding } from '@/types/data-binding'

export const useDataBindingStore = defineStore('data-binding', () => {
  const items = ref<DataBinding[]>([])
  const loading = ref(false)
  const previewItems = ref<unknown[]>([])

  async function load() {
    loading.value = true
    try {
      const result = await listDataBindings()
      items.value = result.items
    } finally {
      loading.value = false
    }
  }

  async function loadPreview(id: number | null) {
    previewItems.value = id ? (await previewDataBinding(id))?.preview_data ?? [] : []
  }

  return {
    items,
    loading,
    previewItems,
    load,
    loadPreview,
  }
})
