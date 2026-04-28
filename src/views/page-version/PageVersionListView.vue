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
        <div class="app-page__eyebrow">Page Version Management</div>
        <h1 class="app-page__title">页面版本管理</h1>
        <p class="app-page__description">
          当前页面：{{ page?.name ?? '未知页面' }}（page_id={{ pageId }}）。统一承载版本列表、发布、复制、锁定与进入编辑器入口。
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
              <p class="app-card__description">统一查看版本来源、状态、锁定情况和编辑器入口，避免操作区过散。</p>
            </div>
            <span class="app-card__meta">共 {{ versions.length }} 个版本</span>
          </div>
        </template>

        <el-table v-loading="loading" :data="versions">
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="version_no" label="版本号" width="90" />
        <el-table-column prop="version_name" label="版本名称" min-width="160" />
        <el-table-column prop="source_type" label="来源类型" width="120" />
        <el-table-column prop="source_id" label="来源 ID" width="100" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="is_locked" label="锁定" width="90">
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
            <el-popconfirm title="确认删除该版本？" @confirm="deletePageVersion(row.id).then(load)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" title="新建版本" width="520px">
      <el-form label-width="100px">
        <el-form-item label="版本名称"><el-input v-model="createForm.version_name" /></el-form-item>
        <el-form-item label="来源类型">
          <el-select v-model="createForm.source_type">
            <el-option v-for="item in PAGE_VERSION_SOURCE_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源 ID">
          <el-input-number v-model="createForm.source_id" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" />
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
