<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import {
  createNews,
  deleteNews,
  getNewsDetail,
  listNews,
  updateNews,
} from '@/api/news-management'
import { listNewsCategories } from '@/api/news-category-management'
import type { NewsItem, NewsWriteInput } from '@/types/news'
import type { NewsCategoryItem } from '@/types/news-category'

type BoolFilter = '' | 'true' | 'false'

const loading = ref(false)
const submitLoading = ref(false)
const deleteLoadingId = ref<number | null>(null)

const query = reactive({
  title: '',
  categoryId: null as number | null,
  status: '' as BoolFilter,
  isTop: '' as BoolFilter,
  current: 1,
  size: 10,
})

const items = ref<NewsItem[]>([])
const total = ref(0)
const categories = ref<NewsCategoryItem[]>([])

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const detailDialogVisible = ref(false)
const detailPayload = ref<NewsItem | null>(null)
const detailContent = computed(() => JSON.stringify(detailPayload.value ?? {}, null, 2))

const form = reactive<NewsWriteInput>({
  categoryId: 0,
  title: '',
  summary: null,
  content: null,
  coverImage: null,
  publishTime: '',
  source: null,
  author: null,
  status: true,
  isTop: false,
  remark: null,
})

const rules: FormRules<typeof form> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请输入分类ID', trigger: 'change' }],
  publishTime: [{ required: true, message: '请选择发布时间', trigger: 'change' }],
}

function toNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }
  const text = value.trim()
  return text === '' ? null : text
}

function parseBoolFilter(value: BoolFilter): boolean | undefined {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  return undefined
}

function formatStatus(value: boolean | null | undefined): string {
  return value ? '发布' : '草稿'
}

function formatTop(value: boolean | null | undefined): string {
  return value ? '置顶' : '非置顶'
}

function resetForm() {
  editingId.value = null
  form.categoryId = 0
  form.title = ''
  form.summary = null
  form.content = null
  form.coverImage = null
  form.publishTime = ''
  form.source = null
  form.author = null
  form.status = true
  form.isTop = false
  form.remark = null
}

function fillFormFromRow(row: NewsItem) {
  editingId.value = row.id ?? null
  form.categoryId = Number(row.categoryId ?? 0)
  form.title = row.title ?? ''
  form.summary = row.summary ?? null
  form.content = row.content ?? null
  form.coverImage = row.coverImage ?? null
  form.publishTime = row.publishTime ?? ''
  form.source = row.source ?? null
  form.author = row.author ?? null
  form.status = row.status ?? true
  form.isTop = row.isTop ?? false
  form.remark = row.remark ?? null
}

function buildWritePayload(): NewsWriteInput {
  return {
    categoryId: Number(form.categoryId),
    title: form.title.trim(),
    summary: toNullableText(form.summary),
    content: toNullableText(form.content),
    coverImage: toNullableText(form.coverImage),
    publishTime: String(form.publishTime),
    source: toNullableText(form.source),
    author: toNullableText(form.author),
    status: form.status ?? true,
    isTop: form.isTop ?? false,
    remark: toNullableText(form.remark),
  }
}

async function loadCategories() {
  try {
    const result = await listNewsCategories()
    categories.value = result.items
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '新闻分类加载失败')
    categories.value = []
  }
}

async function loadList() {
  loading.value = true
  try {
    const result = await listNews({
      current: query.current,
      size: query.size,
      categoryId: query.categoryId ?? undefined,
      title: query.title.trim() || undefined,
      status: parseBoolFilter(query.status),
      isTop: parseBoolFilter(query.isTop),
    })
    items.value = result.items
    total.value = result.total
    query.current = result.current
    query.size = result.size
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '新闻列表加载失败')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  query.current = 1
  await loadList()
}

async function handleReset() {
  query.title = ''
  query.categoryId = null
  query.status = ''
  query.isTop = ''
  query.current = 1
  query.size = 10
  await loadList()
}

async function handleSizeChange(size: number) {
  query.size = size
  query.current = 1
  await loadList()
}

async function handleCurrentChange(current: number) {
  query.current = current
  await loadList()
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: NewsItem) {
  fillFormFromRow(row)
  dialogVisible.value = true
}

async function openDetailDialog(row: NewsItem) {
  const id = row.id
  if (!id) {
    ElMessage.error('当前记录缺少 id，无法查看详情')
    return
  }
  loading.value = true
  try {
    detailPayload.value = await getNewsDetail(id)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '新闻详情加载失败')
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
      await createNews(payload)
      ElMessage.success('新增新闻成功')
    } else {
      await updateNews(editingId.value, payload)
      ElMessage.success('更新新闻成功')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存新闻失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: NewsItem) {
  const id = row.id
  if (!id) {
    return
  }
  await ElMessageBox.confirm(`确认删除新闻「${row.title ?? id}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
  deleteLoadingId.value = id
  try {
    await deleteNews(id)
    ElMessage.success('删除新闻成功')
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除新闻失败')
  } finally {
    deleteLoadingId.value = null
  }
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadList()])
})
</script>

<template>
  <div class="app-page news-management-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">内容管理</div>
        <h1 class="app-page__title">新闻管理</h1>
        <p class="app-page__description">维护新闻数据，支持查询、详情、新增、编辑与删除。</p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card">
        <el-form inline>
          <el-form-item label="标题">
            <el-input v-model="query.title" clearable placeholder="请输入标题关键词" />
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="query.categoryId" clearable filterable placeholder="全部分类" style="width: 180px">
              <el-option
                v-for="item in categories"
                :key="item.id"
                :label="`${item.id ?? '-'} - ${item.name ?? '-'}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="发布" value="true" />
              <el-option label="草稿" value="false" />
            </el-select>
          </el-form-item>
          <el-form-item label="置顶">
            <el-select v-model="query.isTop" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="置顶" value="true" />
              <el-option label="非置顶" value="false" />
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
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="categoryId" label="分类ID" width="100" />
          <el-table-column prop="publishTime" label="发布时间" min-width="170" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status ? 'success' : 'info'">{{ formatStatus(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="置顶" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isTop ? 'warning' : ''">{{ formatTop(row.isTop) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="viewCount" label="浏览量" width="90" />
          <el-table-column prop="author" label="作者" min-width="120" />
          <el-table-column prop="source" label="来源" min-width="140" />
          <el-table-column label="摘要" min-width="220">
            <template #default="{ row }">
              <span>{{ row.summary || '-' }}</span>
            </template>
          </el-table-column>
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

        <div class="news-management-view__pagination">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :current-page="query.current"
            :page-size="query.size"
            :page-sizes="[10, 20, 50]"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId === null ? '新增新闻' : `编辑新闻 #${editingId}`"
      width="780px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" />
        </el-form-item>
        <el-form-item label="分类ID" prop="categoryId">
          <el-input-number v-model="form.categoryId" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="发布时间" prop="publishTime">
          <el-date-picker
            v-model="form.publishTime"
            type="datetime"
            placeholder="请选择发布时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input v-model="form.coverImage" />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="form.source" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="form.author" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" inline-prompt active-text="发布" inactive-text="草稿" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.isTop" inline-prompt active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="新闻详情" width="820px">
      <pre class="news-management-view__json app-code-block">{{ detailContent }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.news-management-view {
  min-width: 0;
}

.news-management-view__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.news-management-view__json {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
