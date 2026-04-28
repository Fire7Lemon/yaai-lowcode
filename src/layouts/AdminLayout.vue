<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppHeaderBar from '@/components/common/AppHeaderBar.vue'
import AppSidebarMenu from '@/components/common/AppSidebarMenu.vue'

const route = useRoute()

const title = computed(() => String(route.meta.title ?? '平台型低代码后台'))
const description = computed(() => String(route.meta.description ?? '严格基于数据库设计的后台前端实现'))
</script>

<template>
  <el-container class="layout">
    <el-aside width="236px" class="layout__aside">
      <AppSidebarMenu />
    </el-aside>
    <el-container class="layout__body">
      <el-header class="layout__header">
        <AppHeaderBar :title="title" :description="description" />
      </el-header>
      <el-main class="layout__main">
        <div class="layout__page-shell">
          <RouterView />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background: var(--app-bg);
}

.layout__aside {
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.04);
}

.layout__body {
  min-width: 0;
}

.layout__header {
  display: flex;
  align-items: center;
  min-height: 68px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid var(--app-border);
  backdrop-filter: blur(16px);
}

.layout__main {
  overflow: auto;
  padding: 18px;
}

.layout__page-shell {
  width: min(100%, var(--app-content-max-width));
  margin: 0 auto;
}

@media (max-width: 960px) {
  .layout__header {
    min-height: 60px;
    padding: 0 14px;
  }

  .layout__main {
    padding: 14px;
  }
}
</style>
