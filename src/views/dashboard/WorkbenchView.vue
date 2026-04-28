<script setup lang="ts">
const cards = [
  { title: '页面管理', path: '/pages', description: '围绕 page 与 page_version 管理页面和版本。' },
  { title: '页面模板', path: '/page-templates', description: '围绕 page_template 管理整页模板。' },
  { title: '可复用片段', path: '/reusable-fragments', description: '围绕 reusable_fragment 管理片段复用。' },
  { title: '组件定义', path: '/component-defs', description: '围绕 component_def 管理组件注册中心。' },
  { title: '数据绑定', path: '/data-bindings', description: '围绕 data_binding 管理统一绑定配置。' },
  { title: '菜单管理', path: '/menus', description: '围绕 menu 维护导航入口。' },
]
</script>

<template>
  <div class="app-page workbench">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">Workbench</div>
        <h1 class="app-page__title">工作台</h1>
        <p class="app-page__description">
          当前后台前端已经完成统一页面骨架与编辑器主工作区整改，工作台继续作为进入各核心模块的概览页。
        </p>
      </div>
    </section>

    <div class="app-page__content">
      <el-alert
        title="当前工程已切换为平台型低代码后台骨架，所有视图严格围绕数据库字段和 page_node 主线展开。"
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
