<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { ElMessage, ElMessageBox } from 'element-plus'

import { deleteOperationLog, getOperationLogDetail, listOperationLogs } from '@/api/operation-log'
import type { OperationLogItem } from '@/types/operation-log'

const loading = ref(false)
const deleteLoadingId = ref<number | null>(null)

const query = reactive({
  tableName: '',
  operationType: '',
  operator: '',
})

const page = reactive({
  current: 1,
  size: 10,
})

const allItems = ref<OperationLogItem[]>([])

const detailDialogVisible = ref(false)
const detailPayload = ref<OperationLogItem | null>(null)
const detailContent = computed(() => JSON.stringify(detailPayload.value ?? {}, null, 2))

const filteredItems = computed(() => {
  const tableName = query.tableName.trim().toLowerCase()
  const operationType = query.operationType.trim().toLowerCase()
  const operator = query.operator.trim().toLowerCase()
  return allItems.value.filter((item) => {
    const tableMatched = tableName === '' || String(item.tableName ?? '').toLowerCase().includes(tableName)
    const operationMatched =
      operationType === '' || String(item.operationType ?? '').toLowerCase().includes(operationType)
    const operatorMatched = operator === '' || String(item.operator ?? '').toLowerCase().includes(operator)
    return tableMatched && operationMatched && operatorMatched
  })
})

const total = computed(() => filteredItems.value.length)

const pagedItems = computed(() => {
  const start = (page.current - 1) * page.size
  const end = start + page.size
  return filteredItems.value.slice(start, end)
})

function handleCurrentChange(current: number) {
  page.current = current
}

function handleSizeChange(size: number) {
  page.size = size
  page.current = 1
}

function handleSearch() {
  page.current = 1
}

function handleReset() {
  query.tableName = ''
  query.operationType = ''
  query.operator = ''
  page.current = 1
}

async function loadList() {
  loading.value = true
  try {
    const result = await listOperationLogs()
    allItems.value = result.items
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作日志加载失败')
    allItems.value = []
  } finally {
    loading.value = false
  }
}

async function openDetailDialog(row: OperationLogItem) {
  const id = row.id
  if (!id) {
    ElMessage.error('当前记录缺少 id，无法查看详情')
    return
  }
  loading.value = true
  try {
    detailPayload.value = await getOperationLogDetail(id)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '日志详情加载失败')
  } finally {
    loading.value = false
  }
}

async function handleDelete(row: OperationLogItem) {
  const id = row.id
  if (!id) {
    return
  }
  await ElMessageBox.confirm(`确认删除日志记录 #${id} 吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
  deleteLoadingId.value = id
  try {
    await deleteOperationLog(id)
    ElMessage.success('删除日志成功')
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除日志失败')
  } finally {
    deleteLoadingId.value = null
  }
}

onMounted(() => {
  void loadList()
})
</script>

<template>
  <div class="app-page operation-log-management-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">系统管理</div>
        <h1 class="app-page__title">操作日志管理</h1>
        <p class="app-page__description">
          支持本地筛选、本地分页、查看 JSON 详情与删除记录。后端列表接口当前不分页。
        </p>
      </div>
    </section>

    <div class="app-page__content">
      <el-card shadow="never" class="app-card">
        <el-form inline>
          <el-form-item label="表名">
            <el-input v-model="query.tableName" clearable placeholder="如 news / news_category" />
          </el-form-item>
          <el-form-item label="操作类型">
            <el-input v-model="query.operationType" clearable placeholder="如 INSERT / UPDATE / DELETE" />
          </el-form-item>
          <el-form-item label="操作人">
            <el-input v-model="query.operator" clearable placeholder="请输入操作人" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="app-card app-table-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">日志列表</div>
              <p class="app-card__description">数据来源：`GET /log/queryAll`（本地筛选 + 本地分页）</p>
            </div>
            <span class="app-card__meta">共 {{ total }} 条</span>
          </div>
        </template>
        <el-table v-loading="loading" :data="pagedItems">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="operationType" label="操作类型" width="110" />
          <el-table-column prop="tableName" label="表名" min-width="130" />
          <el-table-column prop="recordId" label="记录ID" min-width="100" />
          <el-table-column prop="operator" label="操作人" min-width="100" />
          <el-table-column prop="operateTime" label="操作时间" min-width="170" />
          <el-table-column prop="method" label="方法" min-width="130" />
          <el-table-column label="描述" min-width="180">
            <template #default="{ row }">
              <span>{{ row.description || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetailDialog(row)">查看JSON</el-button>
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

        <div class="operation-log-management-view__pagination">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :current-page="page.current"
            :page-size="page.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <el-dialog v-model="detailDialogVisible" title="操作日志详情(JSON)" width="860px">
      <pre class="operation-log-management-view__json app-code-block">{{ detailContent }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.operation-log-management-view {
  min-width: 0;
}

.operation-log-management-view__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.operation-log-management-view__json {
  margin: 0;
  max-height: 500px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
