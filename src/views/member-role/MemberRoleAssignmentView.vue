<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { ElMessage, ElMessageBox } from 'element-plus'

import {
  assignMemberRoleOne,
  assignMemberRoles,
  deleteAllMemberRoles,
  deleteMemberRole,
  queryMemberRoleIds,
} from '@/api/member-role'
import { listRoles } from '@/api/role'
import type { RoleItem } from '@/types/role'

const loading = ref(false)
const assigning = ref(false)
const memberIdInput = ref<string>('')

const allRoles = ref<RoleItem[]>([])
const selectedRoleIds = ref<number[]>([])
const currentRoleIds = ref<number[]>([])

const currentMemberId = computed<number | null>(() => {
  const parsed = Number(memberIdInput.value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return Math.trunc(parsed)
})

const currentRoles = computed<RoleItem[]>(() => {
  const assigned = new Set(currentRoleIds.value)
  return allRoles.value.filter((role) => {
    const id = Number(role.id ?? 0)
    return Number.isFinite(id) && assigned.has(id)
  })
})

async function loadRoleOptions() {
  try {
    const result = await listRoles()
    allRoles.value = result.items
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色列表加载失败')
    allRoles.value = []
  }
}

async function handleQueryMemberRoles() {
  const memberId = currentMemberId.value
  if (!memberId) {
    ElMessage.warning('请输入有效的 memberId')
    return
  }
  loading.value = true
  try {
    const roleIds = await queryMemberRoleIds(memberId)
    currentRoleIds.value = roleIds
    selectedRoleIds.value = [...roleIds]
    ElMessage.success(`已加载 memberId=${memberId} 的角色数据`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '会员角色查询失败')
    currentRoleIds.value = []
    selectedRoleIds.value = []
  } finally {
    loading.value = false
  }
}

async function handleAssignBatch() {
  const memberId = currentMemberId.value
  if (!memberId) {
    ElMessage.warning('请先输入有效的 memberId')
    return
  }
  const roleIds = selectedRoleIds.value
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (roleIds.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }
  assigning.value = true
  try {
    await assignMemberRoles({ memberId, roleIds })
    ElMessage.success('批量分配角色成功')
    await handleQueryMemberRoles()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '批量分配失败')
  } finally {
    assigning.value = false
  }
}

async function handleAssignOne(roleId: number) {
  const memberId = currentMemberId.value
  if (!memberId) {
    ElMessage.warning('请先输入有效的 memberId')
    return
  }
  assigning.value = true
  try {
    await assignMemberRoleOne(memberId, roleId)
    ElMessage.success('单个分配成功')
    await handleQueryMemberRoles()
  } catch (error) {
    const message = error instanceof Error ? error.message : '单个分配失败'
    if (message.includes('404')) {
      try {
        await assignMemberRoles({ memberId, roleIds: [roleId] })
        ElMessage.success('assignOne 不可用，已使用 assign 完成单个分配')
        await handleQueryMemberRoles()
        return
      } catch (fallbackError) {
        ElMessage.error(fallbackError instanceof Error ? fallbackError.message : '单个分配失败')
      }
    } else {
      ElMessage.error(message)
    }
  } finally {
    assigning.value = false
  }
}

async function handleDeleteOne(roleId: number) {
  const memberId = currentMemberId.value
  if (!memberId) {
    return
  }
  await ElMessageBox.confirm(`确认移除角色 #${roleId} 吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
  assigning.value = true
  try {
    await deleteMemberRole(memberId, roleId)
    ElMessage.success('删除角色成功')
    await handleQueryMemberRoles()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除角色失败')
  } finally {
    assigning.value = false
  }
}

async function handleDeleteAll() {
  const memberId = currentMemberId.value
  if (!memberId) {
    ElMessage.warning('请先输入有效的 memberId')
    return
  }
  await ElMessageBox.confirm(`确认清空 memberId=${memberId} 的所有角色吗？`, '清空确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
  assigning.value = true
  try {
    await deleteAllMemberRoles(memberId)
    ElMessage.success('已清空角色')
    await handleQueryMemberRoles()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '清空角色失败')
  } finally {
    assigning.value = false
  }
}

onMounted(() => {
  void loadRoleOptions()
})
</script>

<template>
  <div class="app-page member-role-assignment-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">系统管理</div>
        <h1 class="app-page__title">会员角色分配</h1>
        <p class="app-page__description">按会员 ID 分配或清理角色，支持批量分配、单个分配、单个删除与全部清空。</p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card">
        <div class="member-role-assignment-view__layout">
          <div class="member-role-assignment-view__column">
            <div class="member-role-assignment-view__column-title">会员查询</div>
            <el-form label-position="top">
              <el-form-item label="memberId">
                <el-input v-model="memberIdInput" placeholder="请输入会员 ID（整数）" clearable />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading" @click="handleQueryMemberRoles">查询</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="member-role-assignment-view__column">
            <div class="member-role-assignment-view__column-title">所有角色（可多选）</div>
            <el-scrollbar max-height="380px">
              <el-checkbox-group v-model="selectedRoleIds" class="member-role-assignment-view__checkbox-list">
                <div
                  v-for="role in allRoles"
                  :key="role.id"
                  class="member-role-assignment-view__checkbox-item"
                >
                  <el-checkbox :label="Number(role.id)">
                    {{ role.name || role.code || role.id }}
                  </el-checkbox>
                  <el-button
                    link
                    type="primary"
                    :disabled="!currentMemberId"
                    :loading="assigning"
                    @click="handleAssignOne(Number(role.id))"
                  >
                    单个分配
                  </el-button>
                </div>
              </el-checkbox-group>
            </el-scrollbar>
            <div class="member-role-assignment-view__actions">
              <el-button type="success" :loading="assigning" @click="handleAssignBatch">批量分配</el-button>
            </div>
          </div>

          <div class="member-role-assignment-view__column">
            <div class="member-role-assignment-view__column-title">当前会员已有角色</div>
            <el-scrollbar max-height="380px">
              <div v-if="currentRoles.length === 0" class="member-role-assignment-view__empty">暂无角色</div>
              <div v-for="role in currentRoles" :key="`current-${role.id}`" class="member-role-assignment-view__role-item">
                <div class="member-role-assignment-view__role-copy">
                  <div class="member-role-assignment-view__role-title">{{ role.name || role.code || role.id }}</div>
                  <div class="member-role-assignment-view__role-meta">ID: {{ role.id }}</div>
                </div>
                <el-button link type="danger" :loading="assigning" @click="handleDeleteOne(Number(role.id))">
                  删除
                </el-button>
              </div>
            </el-scrollbar>
            <div class="member-role-assignment-view__actions">
              <el-button type="danger" plain :disabled="currentRoles.length === 0" :loading="assigning" @click="handleDeleteAll">
                清空角色
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.member-role-assignment-view {
  min-width: 0;
}

.member-role-assignment-view__layout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.member-role-assignment-view__column {
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 12px;
  min-height: 460px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-role-assignment-view__column-title {
  font-size: 14px;
  font-weight: 600;
}

.member-role-assignment-view__checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-role-assignment-view__checkbox-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.member-role-assignment-view__actions {
  margin-top: auto;
}

.member-role-assignment-view__empty {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.member-role-assignment-view__role-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.member-role-assignment-view__role-title {
  font-size: 13px;
  font-weight: 600;
}

.member-role-assignment-view__role-meta {
  color: var(--app-text-secondary);
  font-size: 12px;
}

@media (max-width: 1280px) {
  .member-role-assignment-view__layout {
    grid-template-columns: 1fr;
  }
}
</style>
