<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { deletePageTemplate, listPageTemplates } from '@/api/page-template'
import EntityStatusTag from '@/components/common/EntityStatusTag.vue'
import PageSearchForm from '@/components/common/PageSearchForm.vue'
import { PAGE_TEMPLATE_SCENE_OPTIONS } from '@/constants/page'
import type { PageTemplate } from '@/types/page-template'

const loading = ref(false)
const items = ref<PageTemplate[]>([])
const query = reactive({
  name: '',
  code: '',
  scene_type: '',
})

const sceneTypeLabelMap: Record<string, string> = {
  portal_home: '首页场景',
  news_channel: '新闻列表场景',
  single_page: '通用内容页场景',
  landing_page: '专题页场景',
}

async function load() {
  loading.value = true
  try {
    const result = await listPageTemplates(query)
    items.value = result.items
  } finally {
    loading.value = false
  }
}

function reset() {
  query.name = ''
  query.code = ''
  query.scene_type = ''
  load()
}

onMounted(load)
</script>

<template>
  <div class="app-page list-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">整页起点</div>
        <h1 class="app-page__title">页面模板管理</h1>
        <p class="app-page__description">模板用于快速生成整页结构，是页面搭建的起点（page_template）。</p>
      </div>
      <div class="app-page__actions">
        <el-button type="primary" @click="$router.push('/page-templates/create')">新增模板</el-button>
      </div>
    </section>

    <div class="app-page__content">
      <PageSearchForm title="模板筛选" @search="load" @reset="reset">
        <el-form-item label="模板名称"><el-input v-model="query.name" placeholder="请输入模板名称" /></el-form-item>
        <el-form-item label="模板编码"><el-input v-model="query.code" placeholder="请输入模板编码" /></el-form-item>
        <el-form-item label="适用场景">
          <el-select v-model="query.scene_type" clearable placeholder="请选择适用场景">
            <el-option
              v-for="item in PAGE_TEMPLATE_SCENE_OPTIONS"
              :key="item"
              :label="sceneTypeLabelMap[item] ?? item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </PageSearchForm>

      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">页面模板列表</div>
              <p class="app-card__description">可在此查看模板并进入编辑器维护整页结构。</p>
            </div>
            <span class="app-card__meta">共 {{ items.length }} 个模板</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="items">
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="name" label="模板名称" min-width="140" />
        <el-table-column prop="code" label="模板编码" min-width="140" />
        <el-table-column label="适用场景" width="150">
          <template #default="{ row }">
            {{ sceneTypeLabelMap[row.scene_type ?? ''] ?? row.scene_type ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="预览图" width="120">
          <template #default="{ row }">
            <img :src="row.preview_image || ''" alt="模板预览图" class="list-view__image" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <EntityStatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/page-templates/${row.id}/edit`)">编辑</el-button>
            <el-button link type="primary" @click="$router.push(`/page-templates/${row.id}/editor`)">编辑器</el-button>
            <el-popconfirm title="确认删除该模板吗？删除后不可恢复。" @confirm="deletePageTemplate(row.id).then(load)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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

.list-view__image {
  width: 72px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}
</style>
