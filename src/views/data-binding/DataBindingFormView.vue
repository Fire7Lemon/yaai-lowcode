<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { createDataBinding, getDataBinding, updateDataBinding } from '@/api/data-binding'
import JsonCodeEditor from '@/components/common/JsonCodeEditor.vue'
import { DATA_BINDING_TYPE_OPTIONS } from '@/constants/binding'
import type { DataBindingCreateInput } from '@/types/data-binding'

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

const bindingTypeLabelMap: Record<string, string> = {
  article_category: '文章分类数据',
  banner_group: '横幅轮播数据',
  site_config: '站点配置数据',
  manual: '手工静态数据',
  api: '接口数据',
}

/** 非空则校验 JSON.parse；空串映射为 null；保持 string | null 语义。 */
function validateJsonStringOrNull(label: string, raw: string): string | null {
  const t = raw.trim()
  if (!t) {
    return null
  }
  try {
    JSON.parse(t)
    return t
  } catch {
    throw new Error(`${label}须为合法 JSON 字符串`)
  }
}

async function load() {
  if (!isEdit.value) {
    return
  }
  try {
    const detail = await getDataBinding(id.value)
    if (!detail) {
      ElMessage.warning('未找到数据绑定')
      return
    }
    Object.assign(form, {
      name: detail.name,
      binding_type: detail.binding_type,
      source_key: detail.source_key,
      query_json: detail.query_json ?? '',
      field_map_json: detail.field_map_json ?? '',
      transform_json: detail.transform_json ?? '',
      empty_state_json: detail.empty_state_json ?? '',
      error_state_json: detail.error_state_json ?? '',
      cache_policy: detail.cache_policy ?? '',
      status: detail.status,
      remark: detail.remark ?? '',
    })
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '数据绑定加载失败')
  }
}

function buildPayloadFromForm(): DataBindingCreateInput {
  return {
    name: form.name.trim(),
    binding_type: form.binding_type.trim(),
    source_key: form.source_key.trim(),
    query_json: validateJsonStringOrNull('查询配置 JSON（query_json）', form.query_json),
    field_map_json: validateJsonStringOrNull('映射配置 JSON（field_map_json）', form.field_map_json),
    transform_json: validateJsonStringOrNull('转换配置 JSON（transform_json）', form.transform_json),
    empty_state_json: validateJsonStringOrNull('空状态 JSON（empty_state_json）', form.empty_state_json),
    error_state_json: validateJsonStringOrNull('错误状态 JSON（error_state_json）', form.error_state_json),
    cache_policy: form.cache_policy.trim() ? form.cache_policy.trim() : null,
    status: form.status,
    remark: form.remark.trim() ? form.remark.trim() : null,
  }
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning('请填写绑定名称')
    return
  }
  if (!form.source_key.trim()) {
    ElMessage.warning('请填写数据源标识 (source_key)')
    return
  }

  let payload: DataBindingCreateInput
  try {
    payload = buildPayloadFromForm()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '表单校验失败')
    return
  }

  try {
    if (isEdit.value) {
      await updateDataBinding(id.value, payload)
    } else {
      await createDataBinding(payload)
    }
    ElMessage.success('数据绑定已保存')
    router.push('/data-bindings')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="app-page app-form-page binding-form-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">数据来源配置</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑数据绑定' : '新建数据绑定' }}</h1>
        <p class="app-page__description">用于配置“组件从哪里取数据、字段如何对应、异常如何显示”。</p>
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
              <p class="app-card__description">按“基础信息 -> 数据处理 -> 状态显示”顺序配置，便于理解与维护。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="130px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">基础信息</h3>
              <p class="app-form-section__description">先确定绑定名称、数据类型和来源标识。</p>
              <div class="app-form-grid">
                <el-form-item label="绑定名称"><el-input v-model="form.name" placeholder="例如：首页新闻列表绑定" /></el-form-item>
                <el-form-item label="绑定类型">
                  <el-select v-model="form.binding_type" filterable allow-create default-first-option>
                    <el-option
                      v-for="item in DATA_BINDING_TYPE_OPTIONS"
                      :key="item"
                      :label="bindingTypeLabelMap[item] ?? item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="数据源标识 (source_key)">
                  <el-input v-model="form.source_key" placeholder="例如：news_feed" />
                </el-form-item>
                <el-form-item label="缓存策略"><el-input v-model="form.cache_policy" placeholder="例如：memory" /></el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="可填写绑定用途说明" />
              </el-form-item>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">数据处理配置</h3>
              <p class="app-form-section__description">按“查询 -> 映射 -> 转换”顺序配置数据处理逻辑。</p>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">查询条件（query_json）</div>
                  <p class="binding-form-view__json-description">定义取数时的筛选条件、数量和排序等参数。</p>
                </div>
                <el-form-item label="查询配置 JSON"><JsonCodeEditor v-model="form.query_json" :rows="10" /></el-form-item>
              </div>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">字段映射（field_map_json）</div>
                  <p class="binding-form-view__json-description">定义“源字段 -> 展示字段”的对应关系。</p>
                </div>
                <el-form-item label="映射配置 JSON"><JsonCodeEditor v-model="form.field_map_json" :rows="10" /></el-form-item>
              </div>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">数据转换（transform_json）</div>
                  <p class="binding-form-view__json-description">定义映射后的拼装、格式化或补充处理规则。</p>
                </div>
                <el-form-item label="转换配置 JSON"><JsonCodeEditor v-model="form.transform_json" :rows="10" /></el-form-item>
              </div>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">状态显示配置</h3>
              <p class="app-form-section__description">用于定义“无数据”和“异常失败”时的显示文案。</p>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">空状态显示（empty_state_json）</div>
                  <p class="binding-form-view__json-description">定义无数据时展示什么内容。</p>
                </div>
                <el-form-item label="空状态 JSON"><JsonCodeEditor v-model="form.empty_state_json" :rows="8" /></el-form-item>
              </div>
              <div class="binding-form-view__json-block">
                <div class="binding-form-view__json-head">
                  <div class="binding-form-view__json-title">错误状态显示（error_state_json）</div>
                  <p class="binding-form-view__json-description">定义请求失败或转换失败时的提示内容。</p>
                </div>
                <el-form-item label="错误状态 JSON"><JsonCodeEditor v-model="form.error_state_json" :rows="8" /></el-form-item>
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
