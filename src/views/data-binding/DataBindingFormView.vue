<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { createDataBinding, getDataBinding, updateDataBinding } from '@/api/data-binding'
import JsonCodeEditor from '@/components/common/JsonCodeEditor.vue'
import { DATA_BINDING_TYPE_OPTIONS } from '@/constants/binding'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const isEdit = computed(() => Number.isFinite(id.value) && id.value > 0)

const form = reactive({
  name: '',
  binding_type: 'manual',
  source_key: '',
  query_json: '',
  field_map_json: '',
  transform_json: '',
  empty_state_json: '',
  error_state_json: '',
  cache_policy: '',
  status: true,
  remark: '',
})

async function load() {
  if (!isEdit.value) {
    return
  }
  const detail = await getDataBinding(id.value)
  if (!detail) {
    return
  }
  Object.assign(form, {
    ...detail,
    query_json: detail.query_json ?? '',
    field_map_json: detail.field_map_json ?? '',
    transform_json: detail.transform_json ?? '',
    empty_state_json: detail.empty_state_json ?? '',
    error_state_json: detail.error_state_json ?? '',
    cache_policy: detail.cache_policy ?? '',
    remark: detail.remark ?? '',
  })
}

async function submit() {
  const payload = {
    ...form,
    query_json: form.query_json || null,
    field_map_json: form.field_map_json || null,
    transform_json: form.transform_json || null,
    empty_state_json: form.empty_state_json || null,
    error_state_json: form.error_state_json || null,
    cache_policy: form.cache_policy || null,
    remark: form.remark || null,
  }
  if (isEdit.value) {
    await updateDataBinding(id.value, payload)
  } else {
    await createDataBinding(payload)
  }
  ElMessage.success('数据绑定已保存')
  router.push('/data-bindings')
}

onMounted(load)
</script>

<template>
  <div class="app-page app-form-page binding-form-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">Data Binding Form</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑数据绑定' : '新建数据绑定' }}</h1>
        <p class="app-page__description">重点解决长页面的分组、节奏与 JSON 区块承载问题，而不是单纯放宽页面宽度。</p>
      </div>
      <div class="app-page__actions">
        <el-button @click="$router.back()">返回列表</el-button>
      </div>
    </section>

    <div class="app-form-page__main">
      <el-card shadow="never" class="app-card">
        <template #header>
          <div class="app-card__header-line">
            <div class="app-card__title-group">
              <div class="app-card__title">数据绑定配置</div>
              <p class="app-card__description">按基础信息、查询与映射、状态处理三组组织长页面，降低阅读和测试成本。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="130px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">基础信息</h3>
              <p class="app-form-section__description">承载名称、类型、数据源标识、缓存策略和状态。</p>
              <div class="app-form-grid">
                <el-form-item label="绑定名称"><el-input v-model="form.name" /></el-form-item>
                <el-form-item label="绑定类型">
                  <el-select v-model="form.binding_type">
                    <el-option v-for="item in DATA_BINDING_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="数据源标识"><el-input v-model="form.source_key" /></el-form-item>
                <el-form-item label="缓存策略"><el-input v-model="form.cache_policy" /></el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
              <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="4" /></el-form-item>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">查询与字段映射</h3>
              <p class="app-form-section__description">把读取逻辑和字段映射放在同一组，避免 JSON 编辑区零散分布。</p>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">query_json</div>
                  <p class="binding-form-view__json-description">定义查询条件和读取参数。</p>
                </div>
                <el-form-item label="query_json"><JsonCodeEditor v-model="form.query_json" :rows="10" /></el-form-item>
              </div>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">field_map_json</div>
                  <p class="binding-form-view__json-description">定义源字段到目标字段的映射关系。</p>
                </div>
                <el-form-item label="field_map_json"><JsonCodeEditor v-model="form.field_map_json" :rows="10" /></el-form-item>
              </div>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">transform_json</div>
                  <p class="binding-form-view__json-description">定义映射后的转换、拼装或格式化逻辑。</p>
                </div>
                <el-form-item label="transform_json"><JsonCodeEditor v-model="form.transform_json" :rows="10" /></el-form-item>
              </div>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">空态与异常态</h3>
              <p class="app-form-section__description">将状态型 JSON 配置集中承载，让长页面的节奏更稳定。</p>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">empty_state_json</div>
                  <p class="binding-form-view__json-description">数据为空时的展示和占位策略。</p>
                </div>
                <el-form-item label="empty_state_json"><JsonCodeEditor v-model="form.empty_state_json" :rows="8" /></el-form-item>
              </div>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">error_state_json</div>
                  <p class="binding-form-view__json-description">接口异常或转换失败时的兜底展示策略。</p>
                </div>
                <el-form-item label="error_state_json"><JsonCodeEditor v-model="form.error_state_json" :rows="8" /></el-form-item>
              </div>
            </section>

            <div class="app-form-actions">
              <el-button type="primary" @click="submit">保存</el-button>
              <el-button @click="$router.back()">返回</el-button>
            </div>
          </el-form>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.binding-form-view {
  min-width: 0;
}

.binding-form-view__json-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(219, 229, 240, 0.9);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.binding-form-view__json-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.binding-form-view__json-title {
  color: var(--app-text);
  font-size: 14px;
  font-weight: 700;
}

.binding-form-view__json-description {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.6;
}
</style>
