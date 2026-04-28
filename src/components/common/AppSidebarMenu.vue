<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface SidebarItem {
  index: string
  title: string
}

const router = useRouter()
const route = useRoute()

const items = computed<SidebarItem[]>(() => [
  { index: '/workbench', title: '工作台' },
  { index: '/pages', title: '页面管理' },
  { index: '/page-templates', title: '页面模板' },
  { index: '/reusable-fragments', title: '可复用片段' },
  { index: '/menus', title: '菜单管理' },
  { index: '/component-defs', title: '组件定义' },
  { index: '/data-bindings', title: '数据绑定' },
])

function handleSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar__brand">
      <div class="sidebar__brand-mark">Y</div>
      <div class="sidebar__brand-copy">
        <div class="sidebar__brand-title">平台型低代码后台</div>
        <div class="sidebar__brand-subtitle">YAAI Admin Console</div>
      </div>
    </div>
    <el-menu
      :default-active="route.path"
      class="sidebar__menu"
      background-color="#0f172a"
      text-color="#cbd5e1"
      active-text-color="#ffffff"
      @select="handleSelect"
    >
      <el-menu-item v-for="item in items" :key="item.index" :index="item.index">
        {{ item.title }}
      </el-menu-item>
    </el-menu>
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

.sidebar__menu {
  flex: 1;
  border-right: none;
}

.sidebar__menu :deep(.el-menu-item) {
  height: 46px;
  margin: 6px 10px;
  border-radius: 12px;
}

.sidebar__menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.85), rgba(59, 130, 246, 0.92)) !important;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
}
</style>
