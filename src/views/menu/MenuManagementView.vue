<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { createMenu, deleteMenu, listMenus, moveMenu, updateMenu } from '@/api/menu'
import { listPages } from '@/api/page'
import EntityStatusTag from '@/components/common/EntityStatusTag.vue'
import type { Menu, MenuCreateInput, MoveMenuInput } from '@/types/menu'
import type { Page } from '@/types/page'
import type { MenuTreeItem } from '@/utils/tree'
import { buildMenuTree } from '@/utils/tree'
import { ElMessage, ElMessageBox } from 'element-plus'

const items = ref<Menu[]>([])
const pages = ref<Page[]>([])
const loading = ref(false)

const tree = computed(() => buildMenuTree(items.value))

const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const formSaving = ref(false)

const formModel = ref<MenuCreateInput>(buildDefaultCreateForm())

const showMoveDialog = ref(false)
const moveSaving = ref(false)
const moveTarget = ref<Menu | null>(null)
const moveForm = ref<MoveMenuInput>({ parent_id: null, sort_order: null })

function buildDefaultCreateForm(): MenuCreateInput {
  return {
    parent_id: null,
    name: '',
    code: `menu_ui_test_${Date.now()}`,
    url_type: 'external',
    page_id: null,
    external_url: 'https://www.example.com',
    sort_order: 901,
    status: true,
    icon: 'Link',
    remark: '菜单 UI 联调测试，稍后删除',
  }
}

function menuRowToInput(row: MenuTreeItem): MenuCreateInput {
  return {
    parent_id: row.parent_id,
    name: row.name,
    code: row.code,
    url_type: row.url_type,
    page_id: row.page_id,
    external_url: row.external_url,
    sort_order: row.sort_order,
    status: row.status,
    icon: row.icon,
    remark: row.remark,
  }
}

function buildParentOptions(excludeId: number | null): Array<{ label: string; value: number | null }> {
  const opts: Array<{ label: string; value: number | null }> = [{ label: '顶级（无父级）', value: null }]
  for (const m of items.value) {
    if (excludeId !== null && m.id === excludeId) {
      continue
    }
    opts.push({ label: `${m.name}（${m.code}）`, value: m.id })
  }
  return opts
}

const formParentOptions = computed(() => {
  const exclude =
    showFormDialog.value && formMode.value === 'edit' && editingId.value !== null ? editingId.value : null
  return buildParentOptions(exclude)
})

const moveParentOptions = computed(() => {
  const exclude =
    showMoveDialog.value && moveTarget.value !== null ? moveTarget.value.id : null
  return buildParentOptions(exclude)
})

async function load() {
  loading.value = true
  try {
    items.value = (await listMenus()).items
    try {
      pages.value = (await listPages()).items
    } catch (pageErr) {
      ElMessage.warning(pageErr instanceof Error ? pageErr.message : '页面列表加载失败')
      pages.value = []
    }
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '菜单列表加载失败')
    items.value = []
  } finally {
    loading.value = false
  }
}

function resolvePageName(pageId: number | null) {
  return pages.value.find((item) => item.id === pageId)?.name ?? '-'
}

function resolveUrlTypeLabel(urlType: Menu['url_type']) {
  return urlType === 'page' ? '站内页面' : '外部链接'
}

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  formModel.value = buildDefaultCreateForm()
  showFormDialog.value = true
}

function openEdit(row: MenuTreeItem) {
  formMode.value = 'edit'
  editingId.value = row.id
  formModel.value = menuRowToInput(row)
  showFormDialog.value = true
}

function validateForm(): boolean {
  const f = formModel.value
  if (!f.name.trim()) {
    ElMessage.warning('请填写菜单名称')
    return false
  }
  if (!f.code.trim()) {
    ElMessage.warning('请填写菜单编码')
    return false
  }
  if (f.url_type === 'page' && f.page_id === null) {
    ElMessage.warning('请选择站内页面')
    return false
  }
  if (f.url_type === 'external' && !(f.external_url ?? '').trim()) {
    ElMessage.warning('请填写外链地址')
    return false
  }
  return true
}

async function submitForm() {
  if (!validateForm()) {
    return
  }
  formSaving.value = true
  try {
    if (formMode.value === 'create') {
      await createMenu(formModel.value)
      ElMessage.success('菜单已创建')
    } else if (editingId.value !== null) {
      await updateMenu(editingId.value, formModel.value)
      ElMessage.success('菜单已更新')
    }
    showFormDialog.value = false
    await load()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    formSaving.value = false
  }
}

async function confirmDelete(row: MenuTreeItem) {
  const childHint =
    row.children?.length ? `该菜单下仍有 ${row.children.length} 个子菜单，删除可能影响导航结构。` : ''
  try {
    await ElMessageBox.confirm(`${childHint}确认删除「${row.name}」吗？`, '删除菜单', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await deleteMenu(row.id)
    ElMessage.success('菜单已删除')
    await load()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '删除失败')
  }
}

function menuTreeItemToMenu(row: MenuTreeItem): Menu {
  return {
    id: row.id,
    parent_id: row.parent_id,
    name: row.name,
    code: row.code,
    url_type: row.url_type,
    page_id: row.page_id,
    external_url: row.external_url,
    sort_order: row.sort_order,
    status: row.status,
    icon: row.icon,
    remark: row.remark,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function openMove(row: MenuTreeItem) {
  moveTarget.value = menuTreeItemToMenu(row)
  moveForm.value = {
    parent_id: row.parent_id,
    sort_order: row.sort_order,
  }
  showMoveDialog.value = true
}

async function submitMove() {
  if (!moveTarget.value) {
    return
  }
  moveSaving.value = true
  try {
    await moveMenu(moveTarget.value.id, moveForm.value)
    ElMessage.success('菜单位置已更新')
    showMoveDialog.value = false
    await load()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '移动失败，请稍后重试')
  } finally {
    moveSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="app-page menu-view" v-loading="loading">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">导航核对页</div>
        <h1 class="app-page__title">菜单管理</h1>
        <p class="app-page__description">用于核对导航结构与页面映射关系，确认前台菜单是否配置正确。</p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card menu-view__card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">导航结构树</div>
              <p class="app-card__description">按层级查看导航项、链接目标和页面对应关系。</p>
            </div>
            <div class="menu-view__toolbar">
              <span class="app-card__meta">共 {{ items.length }} 个菜单节点</span>
              <el-button type="primary" size="small" @click="openCreate">新建菜单</el-button>
              <el-button size="small" @click="load">刷新</el-button>
            </div>
          </div>
        </template>
        <div class="menu-view__tree-shell">
          <el-empty v-if="!tree.length" description="暂无导航数据" :image-size="72" />
          <el-tree :data="tree" node-key="id" default-expand-all :props="{ children: 'children', label: 'name' }">
            <template #default="{ data }">
              <div class="menu-view__node">
                <div class="menu-view__node-main">
                  <div class="menu-view__node-name">{{ data.name }}</div>
                  <div class="menu-view__meta">
                    <span>编码：{{ data.code }}</span>
                    <span>链接类型：{{ resolveUrlTypeLabel(data.url_type) }}</span>
                    <span v-if="data.url_type === 'page'">页面：{{ resolvePageName(data.page_id) }}</span>
                    <span v-else>外链：{{ data.external_url }}</span>
                  </div>
                </div>
                <div class="menu-view__node-actions" @click.stop>
                  <EntityStatusTag :status="data.status" true-text="显示" false-text="隐藏" />
                  <el-button link type="primary" size="small" @click="openEdit(data)">编辑</el-button>
                  <el-button link type="primary" size="small" @click="openMove(data)">调整位置</el-button>
                  <el-button link type="danger" size="small" @click="confirmDelete(data)">删除</el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="showFormDialog"
      :title="formMode === 'create' ? '新建菜单' : '编辑菜单'"
      width="520px"
      destroy-on-close
      @closed="formSaving = false"
    >
      <el-form label-width="108px">
        <el-form-item label="父级菜单">
          <el-select v-model="formModel.parent_id" placeholder="顶级" clearable filterable style="width: 100%">
            <el-option v-for="opt in formParentOptions" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="formModel.name" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="编码" required>
          <el-input v-model="formModel.code" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="链接类型">
          <el-radio-group v-model="formModel.url_type">
            <el-radio value="page">站内页面</el-radio>
            <el-radio value="external">外部链接</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formModel.url_type === 'page'" label="页面" required>
          <el-select v-model="formModel.page_id" placeholder="选择页面" clearable filterable style="width: 100%">
            <el-option v-for="p in pages" :key="p.id" :label="`${p.name}（${p.code}）`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formModel.url_type === 'external'" label="外链 URL" required>
          <el-input v-model="formModel.external_url!" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formModel.sort_order" :min="0" :max="999999" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="显示">
          <el-switch v-model="formModel.status" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="formModel.icon!" maxlength="120" placeholder="如图标 key：Link" clearable />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formModel.remark!" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" :loading="formSaving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showMoveDialog" title="调整菜单位置" width="440px" destroy-on-close @closed="moveSaving = false">
      <p v-if="moveTarget" class="menu-view__move-hint">菜单：{{ moveTarget.name }}（{{ moveTarget.code }}）</p>
      <el-form label-width="108px">
        <el-form-item label="父级菜单">
          <el-select v-model="moveForm.parent_id" placeholder="顶级" clearable filterable style="width: 100%">
            <el-option v-for="opt in moveParentOptions" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="moveForm.sort_order" :min="0" :max="999999" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMoveDialog = false">取消</el-button>
        <el-button type="primary" :loading="moveSaving" @click="submitMove">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.menu-view {
  min-width: 0;
}

.menu-view__card {
  min-height: 620px;
}

.menu-view__card :deep(.el-card__body) {
  min-height: 520px;
}

.menu-view__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.menu-view__tree-shell {
  min-height: 100%;
  padding: 6px 4px 6px 0;
}

.menu-view__tree-shell :deep(.el-tree) {
  background: transparent;
}

.menu-view__tree-shell :deep(.el-tree-node__content) {
  height: auto;
  min-height: 58px;
  padding: 8px 10px 8px 0;
  border-radius: 14px;
}

.menu-view__tree-shell :deep(.el-tree-node__content:hover) {
  background: rgba(37, 99, 235, 0.06);
}

.menu-view__node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 2px 0;
}

.menu-view__node-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.menu-view__node-name {
  color: var(--app-text);
  font-weight: 600;
}

.menu-view__meta {
  display: flex;
  gap: 12px;
  color: var(--app-text-muted);
  font-size: 12px;
  flex-wrap: wrap;
}

.menu-view__node-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
}

.menu-view__move-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--app-text-muted);
}
</style>
