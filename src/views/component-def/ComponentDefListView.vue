<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { listComponentDefs, setComponentDefStatus } from '@/api/component-def'
import EntityStatusTag from '@/components/common/EntityStatusTag.vue'
import PageSearchForm from '@/components/common/PageSearchForm.vue'
import { COMPONENT_GROUP_OPTIONS, COMPONENT_TYPE_OPTIONS } from '@/constants/component'
import type { ComponentDef } from '@/types/component-def'

const loading = ref(false)
const items = ref<ComponentDef[]>([])
const query = reactive({
  component_name: '',
  component_group: '',
  component_type: '',
})

const componentGroupLabelMap: Record<string, string> = {
  layout: '布局类',
  basic: '基础类',
  content: '内容类',
  data_view: '数据展示类',
  navigation: '导航类',
  interactive: '交互类',
}

const componentTypeLabelMap: Record<string, string> = {
  container: '容器',
  grid: '网格容器',
  tabs: '标签页容器',
  hero_banner: '首屏横幅',
  news_list: '新闻列表',
  notice_list: '公告列表',
  rich_text: '富文本',
  image_text: '图文模块',
  card_list: '卡片列表',
  quick_links: '快捷链接',
  friend_links: '友情链接',
}

async function load() {
  loading.value = true
  try {
    const result = await listComponentDefs(query)
    items.value = result.items
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="app-page list-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">组件能力配置</div>
        <h1 class="app-page__title">组件定义管理</h1>
        <p class="app-page__description">在这里配置“组件能做什么、能放什么、能绑定什么”（component_def）。</p>
      </div>
      <div class="app-page__actions">
        <el-button type="primary" @click="$router.push('/component-defs/create')">新增组件定义</el-button>
      </div>
    </section>

    <div class="app-page__content">
      <PageSearchForm title="组件筛选" @search="load" @reset="load">
        <el-form-item label="组件名称"><el-input v-model="query.component_name" placeholder="请输入组件名称" /></el-form-item>
        <el-form-item label="组件分组">
          <el-select v-model="query.component_group" clearable placeholder="请选择分组">
            <el-option
              v-for="item in COMPONENT_GROUP_OPTIONS"
              :key="item"
              :label="componentGroupLabelMap[item] ?? item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="组件类型">
          <el-select v-model="query.component_type" clearable placeholder="请选择类型">
            <el-option
              v-for="item in COMPONENT_TYPE_OPTIONS"
              :key="item"
              :label="componentTypeLabelMap[item] ?? item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </PageSearchForm>

      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">组件定义列表</div>
              <p class="app-card__description">可快速查看组件能力开关，并进入详情页调整配置。</p>
            </div>
            <span class="app-card__meta">共 {{ items.length }} 个组件定义</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="items">
        <el-table-column prop="component_key" label="组件标识 (component_key)" min-width="180" />
        <el-table-column prop="component_name" label="组件名称" min-width="140" />
        <el-table-column label="组件分组" width="120">
          <template #default="{ row }">
            {{ componentGroupLabelMap[row.component_group ?? ''] ?? row.component_group ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="组件类型" width="140">
          <template #default="{ row }">
            {{ componentTypeLabelMap[row.component_type ?? ''] ?? row.component_type ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="可作为容器" width="96">
          <template #default="{ row }">
            {{ row.is_container ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column label="可绑定数据" width="96">
          <template #default="{ row }">
            {{ row.can_bind_data ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column label="可沉淀为片段" width="118">
          <template #default="{ row }">
            {{ row.can_reuse_as_fragment ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <EntityStatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/component-defs/${row.id}/edit`)">查看/编辑</el-button>
            <el-button link type="warning" @click="setComponentDefStatus(row.id, !row.status).then(load)">
              {{ row.status ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.list-view {
  min-width: 0;
}
</style>
