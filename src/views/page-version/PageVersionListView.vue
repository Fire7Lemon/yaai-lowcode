<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'

import {
  clonePageVersion,
  createPageVersion,
  createPageVersionFromTemplate,
  deletePageVersion,
  listPageVersions,
  publishPageVersion,
  setPageVersionLock,
} from '@/api/page-version'
import { getPage } from '@/api/page'
import { PAGE_VERSION_SOURCE_TYPE_OPTIONS } from '@/constants/page'
import type { Page } from '@/types/page'
import type { PageVersion, PageVersionSourceType } from '@/types/page-version'

const route = useRoute()
const pageId = computed(() => Number(route.params.id))
const page = ref<Page | undefined>()
const versions = ref<PageVersion[]>([])
const dialogVisible = ref(false)
const loading = ref(false)

const createForm = reactive({
  version_name: '',
  source_type: 'manual' as PageVersionSourceType,
  source_id: null as number | null,
  remark: '',
})

const sourceTypeLabelMap: Record<PageVersionSourceType, string> = {
  manual: '手动创建',
  template: '模板生成',
  clone_version: '复制版本',
}

const statusLabelMap: Record<PageVersion['status'], string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

function resolveSourceTypeLabel(sourceType: string | null) {
  if (!sourceType) {
    return '-'
  }
  return sourceTypeLabelMap[sourceType as PageVersionSourceType] ?? sourceType
}

function resolveStatusLabel(status: string) {
  return statusLabelMap[status as PageVersion['status']] ?? status
}

async function load() {
  loading.value = true
  try {
    page.value = await getPage(pageId.value)
    const result = await listPageVersions(pageId.value)
    versions.value = result.items
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (createForm.source_type === 'template' && createForm.source_id) {
    await createPageVersionFromTemplate(pageId.value, {
      template_id: createForm.source_id,
      version_name: createForm.version_name || null,
      remark: createForm.remark || null,
    })
  } else {
    await createPageVersion(pageId.value, {
      version_name: createForm.version_name || null,
      source_type: createForm.source_type === 'template' ? 'manual' : createForm.source_type,
      source_id: createForm.source_type === 'manual' ? null : createForm.source_id,
      remark: createForm.remark || null,
    })
  }
  dialogVisible.value = false
  ElMessage.success('版本已创建')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="app-page version-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">版本主链路</div>
        <h1 class="app-page__title">页面版本管理</h1>
        <p class="app-page__description">
          当前页面：{{ page?.name ?? '未知页面' }}。在这里可完成创建版本、进入编辑、保存验证与发布的完整流程。
        </p>
      </div>
      <div class="app-page__actions">
        <el-button type="primary" @click="dialogVisible = true">新建版本</el-button>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">页面版本列表</div>
              <p class="app-card__description">集中查看版本来源、发布状态、锁定状态和编辑入口。</p>
            </div>
            <span class="app-card__meta">共 {{ versions.length }} 个版本</span>
          </div>
        </template>

        <el-table v-loading="loading" :data="versions">
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="version_no" label="版本号" width="90" />
        <el-table-column prop="version_name" label="版本名称" min-width="160" />
        <el-table-column label="版本来源" width="130">
          <template #default="{ row }">
            {{ resolveSourceTypeLabel(row.source_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="source_id" label="来源编号" width="100" />
        <el-table-column label="发布状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : row.status === 'draft' ? 'info' : 'warning'" effect="plain">
              {{ resolveStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_locked" label="编辑权限" width="96">
          <template #default="{ row }">
            <el-tag :type="row.is_locked ? 'warning' : 'success'">{{ row.is_locked ? '已锁定' : '可编辑' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by" label="创建人" width="120" />
        <el-table-column prop="updated_at" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="$router.push(`/pages/${row.page_id}/versions/${row.id}/editor`)"
            >
              进入编辑器
            </el-button>
            <el-button link type="primary" @click="publishPageVersion(row.id).then(load)">发布</el-button>
            <el-button link type="primary" @click="clonePageVersion(row.id).then(load)">复制</el-button>
            <el-button link type="warning" @click="setPageVersionLock(row.id, !row.is_locked).then(load)">
              {{ row.is_locked ? '解锁' : '锁定' }}
            </el-button>
            <el-popconfirm title="确认删除该版本吗？删除后不可恢复。" @confirm="deletePageVersion(row.id).then(load)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" title="新建页面版本" width="520px">
      <el-form label-width="100px">
        <el-form-item label="版本名称"><el-input v-model="createForm.version_name" placeholder="例如：首页演示版" /></el-form-item>
        <el-form-item label="创建方式">
          <el-select v-model="createForm.source_type">
            <el-option
              v-for="item in PAGE_VERSION_SOURCE_TYPE_OPTIONS"
              :key="item"
              :label="sourceTypeLabelMap[item as PageVersionSourceType] ?? item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="来源编号">
          <el-input-number v-model="createForm.source_id" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="可填写本次版本用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.version-view {
  min-width: 0;
}
</style>
