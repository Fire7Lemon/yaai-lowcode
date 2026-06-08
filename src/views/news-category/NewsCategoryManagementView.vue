<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import {
  createNewsCategory,
  deleteNewsCategory,
  getNewsCategoryDetail,
  listNewsCategories,
  updateNewsCategory,
} from '@/api/news-category-management'
import type { NewsCategoryItem, NewsCategoryWriteInput } from '@/types/news-category'

type StatusFilter = '' | 'true' | 'false'

const loading = ref(false)
const submitLoading = ref(false)
const deleteLoadingId = ref<number | null>(null)

const query = reactive({
  name: '',
  code: '',
  status: '' as StatusFilter,
})

const items = ref<NewsCategoryItem[]>([])
const total = ref(0)

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const detailDialogVisible = ref(false)
const detailPayload = ref<NewsCategoryItem | null>(null)
const detailContent = computed(() => JSON.stringify(detailPayload.value ?? {}, null, 2))

const form = reactive<NewsCategoryWriteInput>({
  parentId: null,
  name: '',
  code: '',
  sortOrder: 0,
  status: true,
  remark: null,
})

const rules: FormRules<typeof form> = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
}

function parseStatusFilter(value: StatusFilter): boolean | undefined {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  return undefined
}

function toNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }
  const text = value.trim()
  return text === '' ? null : text
}

function normalizeNumber(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }
  return Math.trunc(value)
}

function resetForm() {
  editingId.value = null
  form.parentId = null
  form.name = ''
  form.code = ''
  form.sortOrder = 0
  form.status = true
  form.remark = null
}

function fillFormFromRow(row: NewsCategoryItem) {
  editingId.value = row.id ?? null
  form.parentId = normalizeNumber(row.parentId)
  form.name = row.name ?? ''
  form.code = row.code ?? ''
  form.sortOrder = normalizeNumber(row.sortOrder) ?? 0
  form.status = row.status ?? true
  form.remark = row.remark ?? null
}

function buildWritePayload(): NewsCategoryWriteInput {
  return {
    parentId: normalizeNumber(form.parentId),
    name: form.name.trim(),
    code: form.code.trim(),
    sortOrder: normalizeNumber(form.sortOrder),
    status: form.status ?? true,
    remark: toNullableText(form.remark),
  }
}

function formatStatus(value: boolean | null | undefined): string {
  return value ? '启用' : '停用'
}

async function loadList() {
  loading.value = true
  try {
    const result = await listNewsCategories({
      name: query.name.trim() || undefined,
      code: query.code.trim() || undefined,
      status: parseStatusFilter(query.status),
    })
    items.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '新闻分类列表加载失败')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  await loadList()
}

async function handleReset() {
  query.name = ''
  query.code = ''
  query.status = ''
  await loadList()
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: NewsCategoryItem) {
  fillFormFromRow(row)
  dialogVisible.value = true
}

async function openDetailDialog(row: NewsCategoryItem) {
  const id = row.id
  if (!id) {
    ElMessage.error('当前记录缺少 id，无法查看详情')
    return
  }
  loading.value = true
  try {
    detailPayload.value = await getNewsCategoryDetail(id)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '新闻分类详情加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const formEl = formRef.value
  if (!formEl) {
    return
  }
  await formEl.validate()
  submitLoading.value = true
  try {
    const payload = buildWritePayload()
    if (editingId.value === null) {
      await createNewsCategory(payload)
      ElMessage.success('新增新闻分类成功')
    } else {
      await updateNewsCategory(editingId.value, payload)
      ElMessage.success('更新新闻分类成功')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存新闻分类失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: NewsCategoryItem) {
  const id = row.id
  if (!id) {
    return
  }
  await ElMessageBox.confirm(`确认删除分类「${row.name ?? id}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
  deleteLoadingId.value = id
  try {
    await deleteNewsCategory(id)
    ElMessage.success('删除新闻分类成功')
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除新闻分类失败')
  } finally {
    deleteLoadingId.value = null
  }
}

onMounted(() => {
  void loadList()
})
</script>

<template>
  <div class="app-page news-category-management-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">内容管理</div>
        <h1 class="app-page__title">新闻分类管理</h1>
        <p class="app-page__description">
          维护新闻分类数据。本项目中 `parentId` 字段表示“所属菜单ID”。
        </p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card">
        <el-form inline>
          <el-form-item label="分类名称">
            <el-input v-model="query.name" clearable placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item label="分类编码">
            <el-input v-model="query.code" clearable placeholder="请输入分类编码" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="启用" value="true" />
              <el-option label="停用" value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="success" @click="openCreateDialog">新增</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">分类列表</div>
            </div>
            <span class="app-card__meta">共 {{ total }} 条</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="分类名称" min-width="160" />
          <el-table-column prop="code" label="分类编码" min-width="160" />
          <el-table-column prop="parentId" label="所属菜单ID" width="120" />
          <el-table-column prop="sortOrder" label="排序" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status ? 'success' : 'info'">{{ formatStatus(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="180">
            <template #default="{ row }">
              <span>{{ row.remark || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="170" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetailDialog(row)">详情</el-button>
              <el-button link type="success" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                link
                type="danger"
                :loading="deleteLoadingId === row.id"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId === null ? '新增新闻分类' : `编辑新闻分类 #${editingId}`"
      width="680px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="100" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" maxlength="100" />
        </el-form-item>
        <el-form-item label="所属菜单ID">
          <el-input-number v-model="form.parentId" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :step="1" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" inline-prompt active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="新闻分类详情" width="760px">
      <pre class="news-category-management-view__json app-code-block">{{ detailContent }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.news-category-management-view {
  min-width: 0;
}

.news-category-management-view__json {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
