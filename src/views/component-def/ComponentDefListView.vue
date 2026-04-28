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
        <div class="app-page__eyebrow">Component Definition Management</div>
        <h1 class="app-page__title">组件定义管理</h1>
        <p class="app-page__description">围绕 `component_def` 统一查看组件能力、容器属性、可绑定能力与启停状态。</p>
      </div>
      <div class="app-page__actions">
        <el-button type="primary" @click="$router.push('/component-defs/create')">新增组件定义</el-button>
      </div>
    </section>

    <div class="app-page__content">
      <PageSearchForm title="组件筛选" @search="load" @reset="load">
        <el-form-item label="组件名称"><el-input v-model="query.component_name" /></el-form-item>
        <el-form-item label="组件分组">
          <el-select v-model="query.component_group" clearable>
            <el-option v-for="item in COMPONENT_GROUP_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="组件类型">
          <el-select v-model="query.component_type" clearable>
            <el-option v-for="item in COMPONENT_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </PageSearchForm>

      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">组件定义列表</div>
              <p class="app-card__description">在统一列表骨架下承载更多列，重点保证宽表格也保持头部、操作和内容层次稳定。</p>
            </div>
            <span class="app-card__meta">共 {{ items.length }} 个组件定义</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="items">
        <el-table-column prop="component_key" label="组件 Key" min-width="160" />
        <el-table-column prop="component_name" label="组件名称" min-width="140" />
        <el-table-column prop="component_group" label="组件分组" width="120" />
        <el-table-column prop="component_type" label="组件类型" width="140" />
        <el-table-column prop="is_container" label="容器" width="80" />
        <el-table-column prop="can_bind_data" label="可绑定" width="80" />
        <el-table-column prop="can_reuse_as_fragment" label="可沉淀片段" width="100" />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <EntityStatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/component-defs/${row.id}/edit`)">详情/编辑</el-button>
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
