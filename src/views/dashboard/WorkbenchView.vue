<script setup lang="ts">
const cards = [
  { title: '页面管理', path: '/pages', description: '管理页面与页面版本（page / page_version）。' },
  { title: '页面模板', path: '/page-templates', description: '管理整页模板（page_template）。' },
  { title: '可复用片段', path: '/reusable-fragments', description: '管理可复用片段（reusable_fragment）。' },
  { title: '组件定义', path: '/component-defs', description: '管理组件配置中心（component_def）。' },
  { title: '数据绑定', path: '/data-bindings', description: '管理数据绑定配置（data_binding）。' },
  { title: '菜单管理', path: '/menus', description: '维护导航菜单与页面映射（menu）。' },
]
</script>

<template>
  <div class="app-page workbench">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">工作台总览</div>
        <h1 class="app-page__title">工作台</h1>
        <p class="app-page__description">
          从这里可快速进入页面、模板、片段、组件、数据绑定和菜单等核心模块。
        </p>
      </div>
    </section>

    <div class="app-page__content">
      <el-alert
        title="当前系统已按既定模型收口，页面结构树（page_node）是编辑器主线。"
        type="success"
        :closable="false"
      />

      <div class="workbench__grid">
        <el-card v-for="card in cards" :key="card.path" shadow="hover" class="app-card workbench__card">
          <template #header>
            <div class="workbench__card-header">
              <div class="app-card__title-group">
                <div class="app-card__title">{{ card.title }}</div>
              </div>
              <el-button type="primary" link @click="$router.push(card.path)">进入</el-button>
            </div>
          </template>
          <div class="workbench__card-description">{{ card.description }}</div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workbench {
  min-width: 0;
}

.workbench__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.workbench__card {
  min-height: 180px;
}

.workbench__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.workbench__card-description {
  color: var(--app-text-secondary);
  line-height: 1.8;
}
</style>
