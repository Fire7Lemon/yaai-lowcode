<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type UploadRequestOptions,
} from 'element-plus'

import {
  createBanner,
  deleteBanner,
  listActiveBanners,
  listBanners,
  uploadBannerImage,
  updateBanner,
} from '@/api/banner-management'
import type { Banner, BannerWriteInput } from '@/types/banner'

type StatusFilter = '' | 'true' | 'false'

const listLoading = ref(false)
const submitLoading = ref(false)
const uploadLoading = ref(false)
const deleteLoadingId = ref<number | null>(null)
const activeLoading = ref(false)

const query = reactive({
  groupCode: 'home_banner',
  status: '' as StatusFilter,
})

const items = ref<Banner[]>([])
const total = ref(0)
const activeItems = ref<Banner[]>([])

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<BannerWriteInput>({
  title: '',
  subtitle: null,
  imageUrl: '',
  linkUrl: null,
  groupCode: 'home_banner',
  sortOrder: 1,
  status: true,
  startTime: null,
  endTime: null,
  remark: null,
})

const rules: FormRules<typeof form> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请输入图片地址', trigger: 'blur' }],
  groupCode: [{ required: true, message: '请输入分组编码', trigger: 'blur' }],
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

function normalizeSortOrder(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }
  return Math.trunc(value)
}

function resetForm() {
  editingId.value = null
  form.title = ''
  form.subtitle = null
  form.imageUrl = ''
  form.linkUrl = null
  form.groupCode = query.groupCode || 'home_banner'
  form.sortOrder = 1
  form.status = true
  form.startTime = null
  form.endTime = null
  form.remark = null
}

function fillFormFromRow(row: Banner) {
  editingId.value = row.id
  form.title = row.title ?? ''
  form.subtitle = row.subtitle
  form.imageUrl = row.imageUrl ?? ''
  form.linkUrl = row.linkUrl
  form.groupCode = row.groupCode ?? 'home_banner'
  form.sortOrder = row.sortOrder ?? 1
  form.status = row.status ?? true
  form.startTime = row.startTime
  form.endTime = row.endTime
  form.remark = row.remark
}

function buildWritePayload(): BannerWriteInput {
  return {
    title: form.title.trim(),
    subtitle: toNullableText(form.subtitle),
    imageUrl: form.imageUrl.trim(),
    linkUrl: toNullableText(form.linkUrl),
    groupCode: form.groupCode.trim(),
    sortOrder: normalizeSortOrder(form.sortOrder),
    status: form.status ?? true,
    startTime: form.startTime ? String(form.startTime) : null,
    endTime: form.endTime ? String(form.endTime) : null,
    remark: toNullableText(form.remark),
  }
}

async function loadList() {
  listLoading.value = true
  try {
    const result = await listBanners({
      groupCode: query.groupCode.trim() || undefined,
      status: parseStatusFilter(query.status),
    })
    items.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '轮播图列表加载失败')
    items.value = []
    total.value = 0
  } finally {
    listLoading.value = false
  }
}

async function loadActivePreview() {
  activeLoading.value = true
  try {
    activeItems.value = await listActiveBanners('home_banner')
  } catch (error) {
    activeItems.value = []
    ElMessage.error(error instanceof Error ? error.message : '生效轮播图查询失败')
  } finally {
    activeLoading.value = false
  }
}

async function handleSearch() {
  await Promise.all([loadList(), loadActivePreview()])
}

async function handleReset() {
  query.groupCode = 'home_banner'
  query.status = ''
  await handleSearch()
}

function beforeImageUpload(file: File): boolean {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('仅支持上传图片文件')
    return false
  }
  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

async function handleUploadRequest(options: UploadRequestOptions) {
  const candidate = options.file as File
  if (!beforeImageUpload(candidate)) {
    options.onError?.(new Error('invalid image file') as any)
    return
  }

  uploadLoading.value = true
  try {
    const url = await uploadBannerImage(candidate)
    form.imageUrl = url
    ElMessage.success('图片上传成功，已回填图片地址')
    options.onSuccess?.({ url })
  } catch (error) {
    const message = error instanceof Error ? error.message : '图片上传失败'
    ElMessage.error(message)
    options.onError?.(new Error(message) as any)
  } finally {
    uploadLoading.value = false
  }
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: Banner) {
  fillFormFromRow(row)
  dialogVisible.value = true
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
      await createBanner(payload)
      ElMessage.success('新增轮播图成功')
    } else {
      await updateBanner(editingId.value, payload)
      ElMessage.success('更新轮播图成功')
    }
    dialogVisible.value = false
    await handleSearch()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存轮播图失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: Banner) {
  if (!row.id) {
    return
  }
  await ElMessageBox.confirm(`确认删除轮播图「${row.title ?? row.id}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })

  deleteLoadingId.value = row.id
  try {
    await deleteBanner(row.id)
    ElMessage.success('删除轮播图成功')
    await handleSearch()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除轮播图失败')
  } finally {
    deleteLoadingId.value = null
  }
}

onMounted(async () => {
  await handleSearch()
})
</script>

<template>
  <div class="app-page banner-management-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">首页内容管理</div>
        <h1 class="app-page__title">轮播图管理</h1>
        <p class="app-page__description">
          维护 Banner 业务数据（`/banners`），不通过 `page_node.propsJson` 写轮播明细。
        </p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">预览生效轮播（只读）</div>
              <p class="app-card__description">数据来源：`GET /banners/active/home_banner`</p>
            </div>
            <span class="app-card__meta">{{ activeLoading ? '加载中...' : `共 ${activeItems.length} 条` }}</span>
          </div>
        </template>
        <el-skeleton :loading="activeLoading" animated>
          <template #template>
            <el-skeleton-item variant="rect" style="width: 100%; height: 140px" />
          </template>
          <template #default>
            <el-empty v-if="activeItems.length === 0" description="暂无生效轮播图" />
            <div v-else class="banner-management-view__preview-list">
              <el-card
                v-for="banner in activeItems"
                :key="banner.id"
                shadow="hover"
                class="banner-management-view__preview-card"
              >
                <div class="banner-management-view__preview-image-wrap">
                  <img
                    v-if="banner.imageUrl"
                    :src="banner.imageUrl"
                    alt="banner"
                    class="banner-management-view__preview-image"
                  />
                  <div v-else class="banner-management-view__preview-placeholder">无图片</div>
                </div>
                <div class="banner-management-view__preview-body">
                  <h3 class="banner-management-view__preview-title">{{ banner.title || '-' }}</h3>
                  <p class="banner-management-view__preview-subtitle">{{ banner.subtitle || '-' }}</p>
                  <p class="banner-management-view__preview-line">链接：{{ banner.linkUrl || '-' }}</p>
                  <p class="banner-management-view__preview-line">生效：{{ banner.startTime || '-' }}</p>
                  <p class="banner-management-view__preview-line">失效：{{ banner.endTime || '-' }}</p>
                </div>
              </el-card>
            </div>
          </template>
        </el-skeleton>
      </el-card>

      <el-card shadow="never" class="app-card">
        <el-form inline>
          <el-form-item label="分组">
            <el-input v-model="query.groupCode" placeholder="请输入 groupCode（默认 home_banner）" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" style="width: 140px">
              <el-option label="全部" value="" />
              <el-option label="启用" value="true" />
              <el-option label="停用" value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="listLoading" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="success" @click="openCreateDialog">新增</el-button>
          </el-form-item>
        </el-form>
        <div class="banner-management-view__meta">
          <span>列表总数：{{ total }}</span>
          <span>home_banner 生效数：{{ activeLoading ? '加载中...' : activeItems.length }}</span>
        </div>
      </el-card>

      <el-card shadow="never" class="app-card app-table-card">
        <el-table v-loading="listLoading" :data="items">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="groupCode" label="分组" width="140" />
          <el-table-column label="图片" min-width="220">
            <template #default="{ row }">
              <a v-if="row.imageUrl" :href="row.imageUrl" target="_blank" rel="noopener noreferrer">
                {{ row.imageUrl }}
              </a>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="链接" min-width="180">
            <template #default="{ row }">
              <span>{{ row.linkUrl || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="90" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status ? 'success' : 'info'">
                {{ row.status ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="生效时间" min-width="170">
            <template #default="{ row }">
              <span>{{ row.startTime || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="失效时间" min-width="170">
            <template #default="{ row }">
              <span>{{ row.endTime || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
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
      :title="editingId === null ? '新增轮播图' : `编辑轮播图 #${editingId}`"
      width="720px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" />
        </el-form-item>
        <el-form-item label="副标题" prop="subtitle">
          <el-input v-model="form.subtitle" />
        </el-form-item>
        <el-form-item label="图片地址" prop="imageUrl">
          <el-input v-model="form.imageUrl" placeholder="请输入图片 URL 或相对路径" />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            :http-request="handleUploadRequest"
            :show-file-list="false"
            :before-upload="beforeImageUpload"
            accept="image/*"
          >
            <el-button :loading="uploadLoading">选择图片并上传</el-button>
          </el-upload>
          <div class="banner-management-view__upload-tip">
            仅支持 image/*，大小不超过 5MB；上传成功后自动回填 imageUrl。
          </div>
        </el-form-item>
        <el-form-item label="跳转链接" prop="linkUrl">
          <el-input v-model="form.linkUrl" />
        </el-form-item>
        <el-form-item label="分组" prop="groupCode">
          <el-input v-model="form.groupCode" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" inline-prompt active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="生效时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="可选"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="失效时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="可选"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.banner-management-view {
  min-width: 0;
}

.banner-management-view__meta {
  margin-top: 8px;
  display: flex;
  gap: 20px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.banner-management-view__preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}

.banner-management-view__preview-card {
  overflow: hidden;
}

.banner-management-view__preview-image-wrap {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-management-view__preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-management-view__preview-placeholder {
  color: #909399;
  font-size: 13px;
}

.banner-management-view__preview-body {
  margin-top: 10px;
}

.banner-management-view__preview-title {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
}

.banner-management-view__preview-subtitle {
  margin: 6px 0 8px;
  color: #606266;
}

.banner-management-view__preview-line {
  margin: 4px 0;
  color: #909399;
  font-size: 12px;
}

.banner-management-view__upload-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}
</style>
