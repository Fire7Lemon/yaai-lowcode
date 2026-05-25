import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ElMessage } from 'element-plus'

import { listComponentDefs } from '@/api/component-def'
import { YAAI_OFFICIAL_COMPONENT_KEYS, YAAI_OFFICIAL_COMPONENT_KEY_SET } from '@/constants/yaaichannel-component-keys'
import type { ComponentDef } from '@/types/component-def'

export const useComponentDefStore = defineStore('component-def', () => {
  const items = ref<ComponentDef[]>([])
  const loading = ref(false)

  const enabledItems = computed(() => items.value.filter((item) => item.status))

  /** 已启用且按 YAAI 白名单顺序排列的官方物料（编辑器「推荐」区） */
  const paletteOfficialItems = computed(() => {
    const enabled = enabledItems.value
    const byKey = new Map(enabled.map((def) => [def.component_key, def]))
    const list: ComponentDef[] = []
    for (const key of YAAI_OFFICIAL_COMPONENT_KEYS) {
      const def = byKey.get(key)
      if (def) {
        list.push(def)
      }
    }
    return list
  })

  /** 其余已启用定义，按后台 sort_order 排序 */
  const paletteOtherItems = computed(() => {
    return [...enabledItems.value]
      .filter((item) => !YAAI_OFFICIAL_COMPONENT_KEY_SET.has(item.component_key))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  })

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
    paletteOfficialItems,
    paletteOtherItems,
    load,
  }
})
