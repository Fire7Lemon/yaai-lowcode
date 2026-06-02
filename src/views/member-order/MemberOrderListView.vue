<script setup lang="ts">
import { ref } from 'vue'

import { ElMessage } from 'element-plus'

import { getMemberOrderDetail, listMemberOrders } from '@/api/member-order'
import type { MemberOrderItem } from '@/types/member-order'

const memberIdInput = ref('')
const loading = ref(false)
const items = ref<MemberOrderItem[]>([])

const detailDialogVisible = ref(false)
const detailPayload = ref<MemberOrderItem | null>(null)
const detailContent = ref('')

function formatJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2)
}

function resolveMemberId(value: string): number | null {
  const text = value.trim()
  if (text === '') {
    return null
  }
  const parsed = Number(text)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

async function handleSearch() {
  const memberId = resolveMemberId(memberIdInput.value)
  if (!memberId) {
    ElMessage.warning('请输入有效的会员ID（正整数）')
    items.value = []
    return
  }

  loading.value = true
  try {
    items.value = await listMemberOrders(memberId)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '订单查询失败')
    items.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  memberIdInput.value = ''
  items.value = []
}

async function showDetail(row: MemberOrderItem) {
  const outTradeNo = typeof row.outTradeNo === 'string' ? row.outTradeNo : ''
  if (!outTradeNo) {
    ElMessage.error('当前记录缺少 outTradeNo，无法查询详情')
    return
  }

  loading.value = true
  try {
    const detail = await getMemberOrderDetail(outTradeNo)
    detailPayload.value = detail
    detailContent.value = formatJson(detail)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '订单详情查询失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-page member-order-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">会员管理</div>
        <h1 class="app-page__title">会员订单查看</h1>
        <p class="app-page__description">用于按会员ID查看订单记录，不包含管理员全量分页管理能力。</p>
      </div>
    </section>

    <div class="app-page__content">
      <el-alert
        title="当前后端仅支持按 memberId 查询订单，暂不支持管理员全量分页与状态筛选。"
        type="warning"
        :closable="false"
      />

      <el-card shadow="never" class="app-card">
        <el-form inline>
          <el-form-item label="会员ID">
            <el-input v-model="memberIdInput" placeholder="请输入会员ID" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="app-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">订单列表</div>
              <p class="app-card__description">查询结果为当前会员ID对应的全部订单，接口无分页。</p>
            </div>
            <span class="app-card__meta">共 {{ items.length }} 条</span>
          </div>
        </template>

        <el-empty v-if="!memberIdInput.trim()" description="请输入会员ID查询订单。" :image-size="80" />
        <el-table v-else v-loading="loading" :data="items">
          <el-table-column prop="outTradeNo" label="订单号" min-width="170" />
          <el-table-column prop="memberId" label="会员ID" width="100" />
          <el-table-column prop="memberCategoryId" label="会员类别ID" width="120" />
          <el-table-column prop="amount" label="金额" width="110" />
          <el-table-column prop="status" label="订单状态" width="110" />
          <el-table-column prop="paymentMethod" label="支付方式" width="120" />
          <el-table-column prop="createdAt" label="创建时间" min-width="170" />
          <el-table-column prop="paidAt" label="支付时间" min-width="170" />
          <el-table-column prop="expireTime" label="过期时间" min-width="170" />
          <el-table-column prop="closeReason" label="关单原因" min-width="160" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="showDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="detailDialogVisible" title="订单详情" width="760px">
      <pre class="member-order-view__json app-code-block">{{ detailContent }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.member-order-view {
  min-width: 0;
}

.member-order-view__json {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
