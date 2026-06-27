<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import {
  createPermission,
  deletePermission,
  getPermissionDetail,
  listPermissions,
  updatePermission,
} from '@/api/permission'
import type { PermissionItem, PermissionWriteInput } from '@/types/permission'

const loading = ref(false)
const submitLoading = ref(false)
const deleteLoadingId = ref<number | null>(null)

const items = ref<PermissionItem[]>([])
const total = ref(0)

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const detailDialogVisible = ref(false)
const detailPayload = ref<PermissionItem | null>(null)
const detailContent = computed(() => JSON.stringify(detailPayload.value ?? {}, null, 2))

const form = reactive<PermissionWriteInput>({
  name: '',
  code: '',
  module: '',
  description: '',
})

const rules: FormRules<typeof form> = {
  name: [{ required: true, message: '请输入 permissionName', trigger: 'blur' }],
  code: [{ required: true, message: '请输入 permissionCode', trigger: 'blur' }],
}

function toNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }
  const text = value.trim()
  return text === '' ? null : text
}

function resetForm() {
  editingId.value = null
  form.name = ''
  form.code = ''
  form.module = ''
  form.description = ''
}

function fillFormFromRow(row: PermissionItem) {
  editingId.value = row.id ?? null
  form.name = row.name ?? ''
  form.code = row.code ?? ''
  form.module = row.module ?? ''
  form.description = row.description ?? ''
}

function buildWritePayload(): PermissionWriteInput {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    module: toNullableText(form.module)?.trim() || 'general',
    description: toNullableText(form.description)?.trim() || '无',
  }
}

async function loadList() {
  loading.value = true
  try {
    const result = await listPermissions()
    items.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '权限列表加载失败')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: PermissionItem) {
  fillFormFromRow(row)
  dialogVisible.value = true
}

async function openDetailDialog(row: PermissionItem) {
  const id = row.id
  if (!id) {
    ElMessage.error('当前记录缺少 id，无法查看详情')
    return
  }
  loading.value = true
  try {
    detailPayload.value = await getPermissionDetail(id)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '权限详情加载失败')
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
      await createPermission(payload)
      ElMessage.success('新增权限成功')
    } else {
      await updatePermission(editingId.value, payload)
      ElMessage.success('更新权限成功')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存权限失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: PermissionItem) {
  const id = row.id
  if (!id) {
    return
  }
  await ElMessageBox.confirm(`确认删除权限「${row.name ?? id}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
  deleteLoadingId.value = id
  try {
    await deletePermission(id)
    ElMessage.success('删除权限成功')
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除权限失败')
  } finally {
    deleteLoadingId.value = null
  }
}

onMounted(() => {
  void loadList()
})
</script>

<template>
  <div class="app-page permission-management-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">系统管理</div>
        <h1 class="app-page__title">权限管理</h1>
        <p class="app-page__description">维护权限数据，支持查询、详情、新增、编辑与删除。</p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card">
        <el-form inline>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="loadList">刷新</el-button>
            <el-button type="success" @click="openCreateDialog">新增</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">权限列表</div>
            </div>
            <span class="app-card__meta">共 {{ total }} 条</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="items">
          <el-table-column prop="id" label="id" width="90" />
          <el-table-column label="permissionName" min-width="180">
            <template #default="{ row }">
              <span>{{ row.name || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="permissionCode" min-width="220">
            <template #default="{ row }">
              <span>{{ row.code || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="type" min-width="140">
            <template #default="{ row }">
              <span>{{ row.module || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="remark" min-width="220">
            <template #default="{ row }">
              <span>{{ row.description || '-' }}</span>
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
      :title="editingId === null ? '新增权限' : `编辑权限 #${editingId}`"
      width="680px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="permissionName" prop="name">
          <el-input v-model="form.name" maxlength="120" />
        </el-form-item>
        <el-form-item label="permissionCode" prop="code">
          <el-input v-model="form.code" maxlength="180" />
        </el-form-item>
        <el-form-item label="type">
          <el-input v-model="form.module" maxlength="80" placeholder="如 news / member" />
        </el-form-item>
        <el-form-item label="remark">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="权限详情" width="760px">
      <pre class="permission-management-view__json app-code-block">{{ detailContent }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.permission-management-view {
  min-width: 0;
}

.permission-management-view__json {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
