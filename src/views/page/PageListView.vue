<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { deletePage, listPages } from '@/api/page'
import PageSearchForm from '@/components/common/PageSearchForm.vue'
import EntityStatusTag from '@/components/common/EntityStatusTag.vue'
import { PAGE_TYPE_OPTIONS } from '@/constants/page'
import type { Page } from '@/types/page'

const loading = ref(false)
const items = ref<Page[]>([])
const query = reactive({
  name: '',
  code: '',
  path: '',
  page_type: '',
})

async function load() {
  loading.value = true
  try {
    const result = await listPages(query)
    items.value = result.items
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  await deletePage(id)
  await load()
}

function reset() {
  query.name = ''
  query.code = ''
  query.path = ''
  query.page_type = ''
  load()
}

onMounted(load)
</script>

<template>
  <div class="app-page page-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <h1 class="app-page__title">页面管理</h1>
        <p class="app-page__description">集中管理页面基础信息，并快速进入版本管理与页面编辑器。</p>
      </div>
      <div class="app-page__actions">
        <el-button type="primary" @click="$router.push('/pages/create')">新增页面</el-button>
      </div>
    </section>

    <div class="app-page__content">
      <PageSearchForm title="页面筛选" @search="load" @reset="reset">
        <el-form-item label="页面名称">
          <el-input v-model="query.name" placeholder="请输入页面名称" />
        </el-form-item>
        <el-form-item label="页面编码">
          <el-input v-model="query.code" placeholder="请输入页面编码" />
        </el-form-item>
        <el-form-item label="访问路径">
          <el-input v-model="query.path" placeholder="请输入访问路径" />
        </el-form-item>
        <el-form-item label="页面类型">
          <el-select v-model="query.page_type" clearable placeholder="请选择页面类型">
            <el-option v-for="item in PAGE_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </PageSearchForm>

      <el-card shadow="never" class="app-card page-view__table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">页面列表</div>
              <p class="app-card__description">建议先筛选页面，再进入版本管理执行编辑与发布。</p>
            </div>
            <span class="app-card__meta">共 {{ items.length }} 条</span>
          </div>
        </template>

        <el-table v-loading="loading" :data="items">
          <el-table-column prop="id" label="ID" width="72" />
          <el-table-column prop="name" label="页面名称" min-width="140" />
          <el-table-column prop="code" label="页面编码" min-width="140" />
          <el-table-column prop="path" label="访问路径" min-width="150" />
          <el-table-column prop="page_type" label="页面类型" width="120" />
          <el-table-column prop="title" label="页面标题" min-width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <EntityStatusTag :status="row.status" />
            </template>
          </el-table-column>
          <el-table-column prop="current_version_id" label="当前版本" width="120" />
          <el-table-column prop="updated_at" label="更新时间" min-width="180" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/pages/${row.id}/edit`)">编辑</el-button>
              <el-button link type="primary" @click="$router.push(`/pages/${row.id}/versions`)">版本管理</el-button>
              <el-button
                v-if="row.current_version_id"
                link
                type="primary"
                @click="$router.push(`/pages/${row.id}/versions/${row.current_version_id}/editor`)"
              >
                编辑器
              </el-button>
              <el-popconfirm title="确认删除该页面吗？删除后不可恢复。" @confirm="handleDelete(row.id)">
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
.page-view {
  min-width: 0;
}

.page-view__table-card :deep(.el-table) {
  width: 100%;
}

.page-view__table-card :deep(.el-table__inner-wrapper::before) {
  background-color: var(--app-border);
}
</style>
