import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ElMessage } from 'element-plus'

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
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '数据绑定列表加载失败')
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadPreview(id: number | null) {
    if (!id) {
      previewItems.value = []
      return
    }
    try {
      const data = await previewDataBinding(id)
      const rows = data?.preview_data
      previewItems.value = Array.isArray(rows) ? rows : []
      if (!Array.isArray(rows)) {
        ElMessage.warning('预览数据格式异常，已按空数组处理')
      }
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '预览加载失败')
      previewItems.value = []
    }
  }

  return {
    items,
    loading,
    previewItems,
    load,
    loadPreview,
  }
})
