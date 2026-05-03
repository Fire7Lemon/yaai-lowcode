<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { ElMessage } from 'element-plus'

import { deleteReusableFragment, listReusableFragments } from '@/api/reusable-fragment'
import EntityStatusTag from '@/components/common/EntityStatusTag.vue'
import PageSearchForm from '@/components/common/PageSearchForm.vue'
import { FRAGMENT_TYPE_OPTIONS } from '@/constants/page'
import type { ReusableFragment } from '@/types/reusable-fragment'

const loading = ref(false)
const items = ref<ReusableFragment[]>([])
const query = reactive({
  name: '',
  code: '',
  fragment_type: '',
})

const fragmentTypeLabelMap: Record<string, string> = {
  header_section: '顶部区块',
  footer_section: '底部区块',
  hero_section: '首屏区块',
  news_section: '资讯区块',
  links_section: '链接区块',
}

async function load() {
  loading.value = true
  try {
    const result = await listReusableFragments(query)
    items.value = result.items
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '片段列表加载失败')
    items.value = []
  } finally {
    loading.value = false
  }
}

async function confirmDelete(fragmentId: number) {
  try {
    await deleteReusableFragment(fragmentId)
    ElMessage.success('片段已删除')
    await load()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '删除失败')
    await load()
  }
}

function reset() {
  query.name = ''
  query.code = ''
  query.fragment_type = ''
  load()
}

onMounted(load)
</script>

<template>
  <div class="app-page list-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">局部复用</div>
        <h1 class="app-page__title">可复用片段管理</h1>
        <p class="app-page__description">片段用于跨页面复用局部区块，如页脚、联系方式、横幅等（reusable_fragment）。</p>
      </div>
      <div class="app-page__actions">
        <el-button type="primary" @click="$router.push('/reusable-fragments/create')">新增片段</el-button>
      </div>
    </section>

    <div class="app-page__content">
      <PageSearchForm title="片段筛选" @search="load" @reset="reset">
        <el-form-item label="片段名称"><el-input v-model="query.name" placeholder="请输入片段名称" /></el-form-item>
        <el-form-item label="片段编码"><el-input v-model="query.code" placeholder="请输入片段编码" /></el-form-item>
        <el-form-item label="片段类型">
          <el-select v-model="query.fragment_type" clearable placeholder="请选择片段类型">
            <el-option
              v-for="item in FRAGMENT_TYPE_OPTIONS"
              :key="item"
              :label="fragmentTypeLabelMap[item] ?? item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </PageSearchForm>

      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">可复用片段列表</div>
              <p class="app-card__description">可在此维护局部复用区块，并进入编辑器调整片段结构。</p>
            </div>
            <span class="app-card__meta">共 {{ items.length }} 个片段</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="items">
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="name" label="片段名称" min-width="140" />
        <el-table-column prop="code" label="片段编码" min-width="140" />
        <el-table-column label="片段类型" width="140">
          <template #default="{ row }">
            {{ fragmentTypeLabelMap[row.fragment_type ?? ''] ?? row.fragment_type ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <EntityStatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/reusable-fragments/${row.id}/edit`)">编辑</el-button>
            <el-button link type="primary" @click="$router.push(`/reusable-fragments/${row.id}/editor`)">编辑器</el-button>
            <el-popconfirm title="确认删除该片段吗？删除后不可恢复。" @confirm="confirmDelete(row.id)">
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
</style>
