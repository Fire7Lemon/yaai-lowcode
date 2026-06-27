<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import { listPermissions } from '@/api/permission'
import { createRole, deleteRole, getRoleDetail, listRoles, updateRole } from '@/api/role'
import type { PermissionItem } from '@/types/permission'
import type { RoleItem, RoleWriteInput } from '@/types/role'

const loading = ref(false)
const submitLoading = ref(false)
const deleteLoadingId = ref<number | null>(null)

const items = ref<RoleItem[]>([])
const total = ref(0)

const permissionOptions = ref<PermissionItem[]>([])
const detailCache = ref<Record<number, RoleItem>>({})

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const detailDialogVisible = ref(false)
const detailPayload = ref<RoleItem | null>(null)
const detailContent = computed(() => JSON.stringify(detailPayload.value ?? {}, null, 2))

const form = reactive<RoleWriteInput>({
  name: '',
  code: '',
  description: '',
  sortOrder: 0,
  status: true,
  permissions: [],
})

const rules: FormRules<typeof form> = {
  name: [{ required: true, message: '请输入 roleName', trigger: 'blur' }],
  permissions: [{ required: true, type: 'array', min: 1, message: '请至少选择一个权限', trigger: 'change' }],
}

function resetForm() {
  editingId.value = null
  form.name = ''
  form.code = ''
  form.description = ''
  form.sortOrder = 0
  form.status = true
  form.permissions = []
}

async function loadList() {
  loading.value = true
  try {
    const result = await listRoles()
    items.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色列表加载失败')
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadPermissionOptions() {
  try {
    const result = await listPermissions()
    permissionOptions.value = result.items
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '权限选项加载失败')
    permissionOptions.value = []
  }
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

async function openEditDialog(row: RoleItem) {
  const id = row.id
  if (!id) {
    ElMessage.error('当前记录缺少 id，无法编辑')
    return
  }
  loading.value = true
  try {
    const detail = await getRoleDetail(id)
    detailCache.value[id] = detail
    editingId.value = id
    form.name = detail.name ?? ''
    form.code = detail.code ?? ''
    form.description = detail.description ?? ''
    form.sortOrder = Number(detail.sortOrder ?? 0)
    form.status = detail.status ?? true
    form.permissions = (detail.permissions ?? [])
      .map((permission) => Number(permission.id ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0)
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色详情加载失败')
  } finally {
    loading.value = false
  }
}

async function openDetailDialog(row: RoleItem) {
  const id = row.id
  if (!id) {
    ElMessage.error('当前记录缺少 id，无法查看详情')
    return
  }
  loading.value = true
  try {
    const detail = await getRoleDetail(id)
    detailCache.value[id] = detail
    detailPayload.value = detail
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色详情加载失败')
  } finally {
    loading.value = false
  }
}

function buildWritePayload(): RoleWriteInput {
  return {
    name: form.name.trim(),
    code: form.code.trim() || form.name.trim(),
    description: form.description.trim() || '无',
    sortOrder: Number.isFinite(form.sortOrder) ? Math.trunc(form.sortOrder) : 0,
    status: form.status ?? true,
    permissions: form.permissions.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
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
    if (payload.permissions.length === 0) {
      ElMessage.warning('请至少选择一个权限')
      return
    }
    if (editingId.value === null) {
      await createRole(payload)
      ElMessage.success('新增角色成功')
    } else {
      await updateRole(editingId.value, payload)
      ElMessage.success('更新角色成功')
      delete detailCache.value[editingId.value]
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存角色失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: RoleItem) {
  const id = row.id
  if (!id) {
    return
  }
  await ElMessageBox.confirm(`确认删除角色「${row.name ?? id}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
  deleteLoadingId.value = id
  try {
    await deleteRole(id)
    ElMessage.success('删除角色成功')
    delete detailCache.value[id]
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除角色失败')
  } finally {
    deleteLoadingId.value = null
  }
}

async function handleExpandChange(row: RoleItem, expandedRows: RoleItem[]) {
  const id = row.id
  if (!id || !expandedRows.some((item) => item.id === id)) {
    return
  }
  if (detailCache.value[id]) {
    return
  }
  try {
    const detail = await getRoleDetail(id)
    detailCache.value[id] = detail
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '权限详情加载失败')
  }
}

function resolvePermissions(row: RoleItem): PermissionItem[] {
  const id = row.id
  if (id && detailCache.value[id]?.permissions) {
    return detailCache.value[id].permissions ?? []
  }
  return row.permissions ?? []
}

onMounted(async () => {
  await Promise.all([loadPermissionOptions(), loadList()])
})
</script>

<template>
  <div class="app-page role-management-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">系统管理</div>
        <h1 class="app-page__title">角色管理</h1>
        <p class="app-page__description">维护角色与权限绑定关系，支持角色新增、编辑、详情和删除。</p>
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
              <div class="app-card__title">角色列表</div>
            </div>
            <span class="app-card__meta">共 {{ total }} 条</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="items" @expand-change="handleExpandChange">
          <el-table-column type="expand" width="50">
            <template #default="{ row }">
              <div class="role-management-view__permission-panel">
                <div class="role-management-view__permission-title">permissions</div>
                <div class="role-management-view__permission-list">
                  <el-tag
                    v-for="permission in resolvePermissions(row)"
                    :key="`${row.id ?? 'x'}-${permission.id ?? permission.code ?? permission.name}`"
                    type="info"
                    class="role-management-view__permission-tag"
                  >
                    {{ permission.name || permission.code || `#${permission.id}` }}
                  </el-tag>
                  <span v-if="resolvePermissions(row).length === 0" class="role-management-view__empty">暂无权限</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="id" label="id" width="80" />
          <el-table-column label="roleName" min-width="180">
            <template #default="{ row }">
              <span>{{ row.name || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="roleCode" min-width="180" />
          <el-table-column label="remark" min-width="220">
            <template #default="{ row }">
              <span>{{ row.description || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="sortOrder" width="110" />
          <el-table-column label="status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '停用' }}</el-tag>
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
      </el-card>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId === null ? '新增角色' : `编辑角色 #${editingId}`"
      width="760px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="roleName" prop="name">
          <el-input v-model="form.name" maxlength="120" />
        </el-form-item>
        <el-form-item label="roleCode">
          <el-input v-model="form.code" maxlength="120" placeholder="留空时默认与 roleName 一致" />
        </el-form-item>
        <el-form-item label="remark">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="sortOrder">
          <el-input-number v-model="form.sortOrder" :step="1" />
        </el-form-item>
        <el-form-item label="status">
          <el-switch v-model="form.status" inline-prompt active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="permissions" prop="permissions">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox
              v-for="permission in permissionOptions"
              :key="permission.id"
              :label="Number(permission.id)"
            >
              {{ permission.name || permission.code || permission.id }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="角色详情" width="780px">
      <pre class="role-management-view__json app-code-block">{{ detailContent }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.role-management-view {
  min-width: 0;
}

.role-management-view__permission-panel {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 6px 0;
}

.role-management-view__permission-title {
  width: 90px;
  flex-shrink: 0;
  color: var(--app-text-secondary);
}

.role-management-view__permission-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-management-view__permission-tag {
  margin-right: 0;
}

.role-management-view__empty {
  color: var(--app-text-secondary);
}

.role-management-view__json {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
