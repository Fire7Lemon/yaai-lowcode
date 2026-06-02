<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { ElMessage, ElMessageBox } from 'element-plus'

import { auditPass, auditReject, listPendingCompanyMembers, listPendingSingleMembers } from '@/api/member-audit'
import type { CompanyMemberAuditItem, SingleMemberAuditItem } from '@/types/member-audit'

type AuditTab = 'single' | 'company'

const activeTab = ref<AuditTab>('single')
const loading = ref(false)
const page = reactive({
  current: 1,
  size: 10,
})

const singleItems = ref<SingleMemberAuditItem[]>([])
const singleTotal = ref(0)
const companyItems = ref<CompanyMemberAuditItem[]>([])
const companyTotal = ref(0)

const detailDialogVisible = ref(false)
const detailTitle = ref('会员详情')
const detailPayload = ref<Record<string, unknown> | null>(null)
const detailContent = computed(() => JSON.stringify(detailPayload.value ?? {}, null, 2))

function normalizeMemberId(row: Record<string, unknown>): number | null {
  const raw = row.memberId ?? row.id
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function pickText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }
  return '-'
}

async function loadCurrentTab() {
  loading.value = true
  try {
    if (activeTab.value === 'single') {
      const result = await listPendingSingleMembers({ current: page.current, size: page.size })
      singleItems.value = result.items
      singleTotal.value = result.total
      return
    }

    const result = await listPendingCompanyMembers({ current: page.current, size: page.size })
    companyItems.value = result.items
    companyTotal.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载待审核列表失败')
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  page.current = 1
  void loadCurrentTab()
}

function handleSizeChange(size: number) {
  page.size = size
  page.current = 1
  void loadCurrentTab()
}

function handleCurrentChange(current: number) {
  page.current = current
  void loadCurrentTab()
}

function showDetail(row: Record<string, unknown>, title: string) {
  detailTitle.value = title
  detailPayload.value = row
  detailDialogVisible.value = true
}

async function handleAuditAction(row: Record<string, unknown>, action: 'pass' | 'reject') {
  const memberId = normalizeMemberId(row)
  if (!memberId) {
    ElMessage.error('当前记录缺少 memberId/id，无法执行审核操作')
    return
  }

  const actionText = action === 'pass' ? '通过' : '拒绝'
  await ElMessageBox.confirm(`确认${actionText}会员（memberId=${memberId}）吗？`, `审核${actionText}确认`, {
    type: action === 'pass' ? 'success' : 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })

  try {
    if (action === 'pass') {
      await auditPass(memberId)
    } else {
      await auditReject(memberId)
    }
    ElMessage.success(`审核${actionText}成功`)
    await loadCurrentTab()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : `审核${actionText}失败`)
  }
}

onMounted(() => {
  void loadCurrentTab()
})
</script>

<template>
  <div class="app-page member-audit-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">会员管理</div>
        <h1 class="app-page__title">会员审核</h1>
        <p class="app-page__description">按个人/单位维度查看待审核会员，并执行审核通过或拒绝操作。</p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="个人会员待审核" name="single">
            <el-table v-loading="loading" :data="singleItems">
              <el-table-column prop="memberNo" label="会员编号" min-width="140" />
              <el-table-column prop="name" label="姓名" min-width="120" />
              <el-table-column prop="gender" label="性别" width="90" />
              <el-table-column prop="workUnit" label="工作单位" min-width="150" />
              <el-table-column prop="contactPhone" label="联系电话" min-width="130" />
              <el-table-column prop="email" label="邮箱" min-width="180" />
              <el-table-column prop="committeeName" label="所属委员会" min-width="140" />
              <el-table-column prop="createdAt" label="申请时间" min-width="170" />
              <el-table-column prop="auditStatus" label="审核状态" width="110" />
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="showDetail(row, '个人会员详情')">查看详情</el-button>
                  <el-button link type="success" @click="handleAuditAction(row, 'pass')">通过</el-button>
                  <el-button link type="danger" @click="handleAuditAction(row, 'reject')">拒绝</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="单位会员待审核" name="company">
            <el-table v-loading="loading" :data="companyItems">
              <el-table-column prop="memberNo" label="会员编号" min-width="140" />
              <el-table-column prop="unitName" label="单位名称" min-width="180" />
              <el-table-column prop="industry" label="行业" min-width="140" />
              <el-table-column prop="leaderName" label="负责人" min-width="110" />
              <el-table-column label="联系人" min-width="110">
                <template #default="{ row }">
                  {{ pickText(row.contactName, row.contactPerson) }}
                </template>
              </el-table-column>
              <el-table-column label="联系电话" min-width="130">
                <template #default="{ row }">
                  {{ pickText(row.contactMobile, row.contactPhone, row.phone, row.mobile) }}
                </template>
              </el-table-column>
              <el-table-column label="邮箱" min-width="180">
                <template #default="{ row }">
                  {{ pickText(row.contactEmail, row.email) }}
                </template>
              </el-table-column>
              <el-table-column prop="committeeName" label="所属委员会" min-width="140" />
              <el-table-column prop="createdAt" label="申请时间" min-width="170" />
              <el-table-column prop="auditStatus" label="审核状态" width="110" />
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="showDetail(row, '单位会员详情')">查看详情</el-button>
                  <el-button link type="success" @click="handleAuditAction(row, 'pass')">通过</el-button>
                  <el-button link type="danger" @click="handleAuditAction(row, 'reject')">拒绝</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>

        <div class="member-audit-view__pagination">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :current-page="page.current"
            :page-size="page.size"
            :page-sizes="[10, 20, 50]"
            :total="activeTab === 'single' ? singleTotal : companyTotal"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <el-dialog v-model="detailDialogVisible" :title="detailTitle" width="760px">
      <pre class="member-audit-view__json app-code-block">{{ detailContent }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.member-audit-view {
  min-width: 0;
}

.member-audit-view__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.member-audit-view__json {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
