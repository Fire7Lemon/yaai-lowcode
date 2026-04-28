<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { deleteDataBinding, listDataBindings, previewDataBinding } from '@/api/data-binding'
import EntityStatusTag from '@/components/common/EntityStatusTag.vue'
import PageSearchForm from '@/components/common/PageSearchForm.vue'
import { DATA_BINDING_TYPE_OPTIONS } from '@/constants/binding'
import type { DataBinding } from '@/types/data-binding'

const loading = ref(false)
const items = ref<DataBinding[]>([])
const previewContent = ref('[]')
const query = reactive({
  name: '',
  binding_type: '',
  source_key: '',
})

async function load() {
  loading.value = true
  try {
    const result = await listDataBindings(query)
    items.value = result.items
  } finally {
    loading.value = false
  }
}

async function showPreview(id: number) {
  const data = await previewDataBinding(id)
  previewContent.value = JSON.stringify(data?.preview_data ?? [], null, 2)
}

onMounted(load)
</script>

<template>
  <div class="app-page list-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">Data Binding Management</div>
        <h1 class="app-page__title">数据绑定管理</h1>
        <p class="app-page__description">统一查看 `data_binding` 配置、预览入口和缓存策略，并保留下方预览承载区。</p>
      </div>
      <div class="app-page__actions">
        <el-button type="primary" @click="$router.push('/data-bindings/create')">新增数据绑定</el-button>
      </div>
    </section>

    <div class="app-page__content">
      <PageSearchForm title="绑定筛选" @search="load" @reset="load">
        <el-form-item label="绑定名称"><el-input v-model="query.name" /></el-form-item>
        <el-form-item label="绑定类型">
          <el-select v-model="query.binding_type" clearable>
            <el-option v-for="item in DATA_BINDING_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源标识"><el-input v-model="query.source_key" /></el-form-item>
      </PageSearchForm>

      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">数据绑定列表</div>
              <p class="app-card__description">列表区统一主操作和表头层次，预览入口继续保留在操作列。</p>
            </div>
            <span class="app-card__meta">共 {{ items.length }} 个绑定</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="items">
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="name" label="绑定名称" min-width="140" />
        <el-table-column prop="binding_type" label="绑定类型" width="140" />
        <el-table-column prop="source_key" label="数据源标识" min-width="140" />
        <el-table-column prop="cache_policy" label="缓存策略" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <EntityStatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/data-bindings/${row.id}/edit`)">编辑</el-button>
            <el-button link type="primary" @click="showPreview(row.id)">预览</el-button>
            <el-popconfirm title="确认删除绑定？" @confirm="deleteDataBinding(row.id).then(load)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never" class="app-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">绑定预览</div>
              <p class="app-card__description">用于测试数据映射后的预览结果，保持与列表卡片一致的承载感。</p>
            </div>
          </div>
        </template>
        <pre class="preview app-code-block">{{ previewContent }}</pre>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.list-view {
  min-width: 0;
}

.preview {
  white-space: pre-wrap;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
