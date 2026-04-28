<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { listMenus } from '@/api/menu'
import { listPages } from '@/api/page'
import EntityStatusTag from '@/components/common/EntityStatusTag.vue'
import type { Menu } from '@/types/menu'
import type { Page } from '@/types/page'
import { buildMenuTree } from '@/utils/tree'

const items = ref<Menu[]>([])
const pages = ref<Page[]>([])

const tree = computed(() => buildMenuTree(items.value))

async function load() {
  items.value = (await listMenus()).items
  pages.value = (await listPages()).items
}

function resolvePageName(pageId: number | null) {
  return pages.value.find((item) => item.id === pageId)?.name ?? '-'
}

onMounted(load)
</script>

<template>
  <div class="app-page menu-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <h1 class="app-page__title">菜单管理</h1>
        <p class="app-page__description">集中查看菜单层级、链接类型与页面映射关系。</p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card menu-view__card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">菜单树</div>
              <p class="app-card__description">以树形结构快速核对导航配置与页面挂载关系。</p>
            </div>
            <span class="app-card__meta">共 {{ items.length }} 个菜单节点</span>
          </div>
        </template>
        <div class="menu-view__tree-shell">
          <el-tree :data="tree" node-key="id" default-expand-all :props="{ children: 'children', label: 'name' }">
            <template #default="{ data }">
              <div class="menu-view__node">
                <div class="menu-view__node-main">
                  <div class="menu-view__node-name">{{ data.name }}</div>
                  <div class="menu-view__meta">
                    <span>编码：{{ data.code }}</span>
                    <span>链接类型：{{ data.url_type }}</span>
                    <span v-if="data.url_type === 'page'">页面：{{ resolvePageName(data.page_id) }}</span>
                    <span v-else>外链：{{ data.external_url }}</span>
                  </div>
                </div>
                <EntityStatusTag :status="data.status" true-text="显示" false-text="隐藏" />
              </div>
            </template>
          </el-tree>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.menu-view {
  min-width: 0;
}

.menu-view__card {
  min-height: 620px;
}

.menu-view__card :deep(.el-card__body) {
  min-height: 520px;
}

.menu-view__tree-shell {
  min-height: 100%;
  padding: 6px 4px 6px 0;
}

.menu-view__tree-shell :deep(.el-tree) {
  background: transparent;
}

.menu-view__tree-shell :deep(.el-tree-node__content) {
  height: auto;
  min-height: 58px;
  padding: 8px 10px 8px 0;
  border-radius: 14px;
}

.menu-view__tree-shell :deep(.el-tree-node__content:hover) {
  background: rgba(37, 99, 235, 0.06);
}

.menu-view__node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 2px 0;
}

.menu-view__node-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.menu-view__node-name {
  color: var(--app-text);
  font-weight: 600;
}

.menu-view__meta {
  display: flex;
  gap: 12px;
  color: var(--app-text-muted);
  font-size: 12px;
  flex-wrap: wrap;
}
</style>
