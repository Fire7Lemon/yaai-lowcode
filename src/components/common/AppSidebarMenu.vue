<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  WORKBENCH_MENU_ITEM,
  getActiveGroupKey,
  getActiveMenuPath,
  getSidebarMenuGroups,
  isMenuItemActive,
} from '@/config/admin-menu'

const router = useRouter()
const route = useRoute()

const menuGroups = getSidebarMenuGroups()

const expandedGroups = ref<Record<string, boolean>>({})

const activeMenuPath = computed(() => getActiveMenuPath(route.path))
const activeGroupKey = computed(() => getActiveGroupKey(route.path))
const isWorkbenchActive = computed(() => isMenuItemActive(WORKBENCH_MENU_ITEM, route.path))

function syncExpandedGroups() {
  const next: Record<string, boolean> = { ...expandedGroups.value }
  const currentGroupKey = activeGroupKey.value

  if (currentGroupKey) {
    next[currentGroupKey] = true
  }

  expandedGroups.value = next
}

watch(
  () => route.path,
  () => {
    syncExpandedGroups()
  },
  { immediate: true },
)

function toggleGroup(groupKey: string) {
  expandedGroups.value = {
    ...expandedGroups.value,
    [groupKey]: !expandedGroups.value[groupKey],
  }
}

function isGroupExpanded(groupKey: string) {
  return expandedGroups.value[groupKey] === true
}

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar__brand">
      <div class="sidebar__brand-mark">Y</div>
      <div class="sidebar__brand-copy">
        <div class="sidebar__brand-title">平台型低代码后台</div>
        <div class="sidebar__brand-subtitle">YAAI 后台控制台</div>
      </div>
    </div>

    <div class="sidebar__body">
      <button
        type="button"
        class="sidebar__workbench"
        :class="{ 'is-active': isWorkbenchActive }"
        @click="navigate(WORKBENCH_MENU_ITEM.path)"
      >
        {{ WORKBENCH_MENU_ITEM.title }}
      </button>

      <div class="sidebar__groups">
        <section v-for="group in menuGroups" :key="group.key" class="sidebar__group">
          <button
            type="button"
            class="sidebar__group-header"
            :class="{ 'is-expanded': isGroupExpanded(group.key), 'is-active-group': activeGroupKey === group.key }"
            @click="toggleGroup(group.key)"
          >
            <span class="sidebar__group-indicator" aria-hidden="true" />
            <span class="sidebar__group-title">{{ group.title }}</span>
            <span class="sidebar__group-arrow" :class="{ 'is-expanded': isGroupExpanded(group.key) }">›</span>
          </button>

          <div v-show="isGroupExpanded(group.key)" class="sidebar__group-children">
            <button
              v-for="child in group.children"
              :key="child.key"
              type="button"
              class="sidebar__child"
              :class="{ 'is-active': activeMenuPath === child.path }"
              @click="navigate(child.path)"
            >
              {{ child.title }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  height: 100%;
  flex-direction: column;
  background: #0f172a;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 18px;
  color: #ffffff;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.sidebar__brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
}

.sidebar__brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__brand-title {
  font-size: 16px;
  font-weight: 700;
}

.sidebar__brand-subtitle {
  color: rgba(203, 213, 225, 0.7);
  font-size: 12px;
}

.sidebar__body {
  flex: 1;
  overflow: auto;
  padding: 12px 10px 16px;
}

.sidebar__workbench {
  width: 100%;
  height: 46px;
  margin-bottom: 12px;
  border: none;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.92);
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

.sidebar__workbench:hover {
  background: rgba(51, 65, 85, 0.95);
}

.sidebar__workbench.is-active {
  color: #ffffff;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.85), rgba(59, 130, 246, 0.92));
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
}

.sidebar__groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar__group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(203, 213, 225, 0.88);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.sidebar__group-header:hover {
  background: rgba(30, 41, 59, 0.72);
  color: #f8fafc;
}

.sidebar__group-header.is-active-group {
  color: #ffffff;
}

.sidebar__group-indicator {
  width: 3px;
  height: 14px;
  border-radius: 999px;
  background: rgba(96, 165, 250, 0.55);
}

.sidebar__group-header.is-active-group .sidebar__group-indicator {
  background: #60a5fa;
}

.sidebar__group-title {
  flex: 1;
  text-align: left;
}

.sidebar__group-arrow {
  color: rgba(148, 163, 184, 0.9);
  font-size: 16px;
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 0.18s ease;
}

.sidebar__group-arrow.is-expanded {
  transform: rotate(270deg);
}

.sidebar__group-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 8px;
}

.sidebar__child {
  width: 100%;
  min-height: 40px;
  padding: 0 12px 0 18px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #cbd5e1;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.sidebar__child:hover {
  background: rgba(30, 41, 59, 0.88);
  color: #ffffff;
}

.sidebar__child.is-active {
  color: #ffffff;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.85), rgba(59, 130, 246, 0.92));
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
}
</style>
