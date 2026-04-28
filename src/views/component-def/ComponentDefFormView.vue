<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { createComponentDef, getComponentDef, updateComponentDef } from '@/api/component-def'
import JsonCodeEditor from '@/components/common/JsonCodeEditor.vue'
import SchemaPreviewPanel from '@/components/common/SchemaPreviewPanel.vue'
import { COMPONENT_GROUP_OPTIONS, COMPONENT_TYPE_OPTIONS } from '@/constants/component'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const isEdit = computed(() => Number.isFinite(id.value) && id.value > 0)

const form = reactive({
  component_key: '',
  component_name: '',
  component_group: 'layout',
  component_type: 'container',
  icon: '',
  is_container: false,
  can_bind_data: false,
  can_reuse_as_fragment: false,
  prop_schema_json: '',
  style_schema_json: '',
  event_schema_json: '',
  layout_schema_json: '',
  allowed_child_types_json: '',
  default_props_json: '',
  default_style_json: '',
  sort_order: 0,
  status: true,
  remark: '',
})

async function load() {
  if (!isEdit.value) {
    return
  }
  const detail = await getComponentDef(id.value)
  if (!detail) {
    return
  }
  Object.assign(form, {
    ...detail,
    icon: detail.icon ?? '',
    prop_schema_json: detail.prop_schema_json ?? '',
    style_schema_json: detail.style_schema_json ?? '',
    event_schema_json: detail.event_schema_json ?? '',
    layout_schema_json: detail.layout_schema_json ?? '',
    allowed_child_types_json: detail.allowed_child_types_json ?? '',
    default_props_json: detail.default_props_json ?? '',
    default_style_json: detail.default_style_json ?? '',
    remark: detail.remark ?? '',
  })
}

async function submit() {
  const payload = {
    ...form,
    icon: form.icon || null,
    prop_schema_json: form.prop_schema_json || null,
    style_schema_json: form.style_schema_json || null,
    event_schema_json: form.event_schema_json || null,
    layout_schema_json: form.layout_schema_json || null,
    allowed_child_types_json: form.allowed_child_types_json || null,
    default_props_json: form.default_props_json || null,
    default_style_json: form.default_style_json || null,
    remark: form.remark || null,
  }

  if (isEdit.value) {
    await updateComponentDef(id.value, payload)
  } else {
    await createComponentDef(payload)
  }

  ElMessage.success('组件定义已保存')
  router.push('/component-defs')
}

onMounted(load)
</script>

<template>
  <div class="app-page app-form-page component-form">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">Component Definition Form</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑组件定义' : '新建组件定义' }}</h1>
        <p class="app-page__description">第二阶段先以统一骨架和分组承载收稳页面，不引入复杂双栏或新的编辑交互。</p>
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
              <div class="app-card__title">组件定义配置</div>
              <p class="app-card__description">先稳定基础字段、能力开关和 JSON 配置区的纵向节奏。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="130px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">基础信息</h3>
              <p class="app-form-section__description">承载组件标识、分组、类型与状态。</p>
              <div class="app-form-grid">
                <el-form-item label="组件 Key"><el-input v-model="form.component_key" /></el-form-item>
                <el-form-item label="组件名称"><el-input v-model="form.component_name" /></el-form-item>
                <el-form-item label="组件分组">
                  <el-select v-model="form.component_group">
                    <el-option v-for="item in COMPONENT_GROUP_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="组件类型">
                  <el-select v-model="form.component_type">
                    <el-option v-for="item in COMPONENT_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="图标"><el-input v-model="form.icon" /></el-form-item>
                <el-form-item label="排序"><el-input-number v-model="form.sort_order" :min="0" /></el-form-item>
                <el-form-item label="是否容器"><el-switch v-model="form.is_container" /></el-form-item>
                <el-form-item label="允许绑定数据"><el-switch v-model="form.can_bind_data" /></el-form-item>
                <el-form-item label="允许沉淀片段"><el-switch v-model="form.can_reuse_as_fragment" /></el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
              <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="4" /></el-form-item>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">Schema 配置</h3>
              <p class="app-form-section__description">JSON 大字段按能力维度顺序排列，主表单仍是页面主焦点，预览区只作为辅助理解。</p>
              <div class="component-form__field-block">
                <div class="component-form__field-head">
                  <div class="component-form__field-title">属性 Schema</div>
                  <p class="component-form__field-description">定义组件 props 的可配置项，是后续属性面板理解组件能力的核心入口。</p>
                </div>
                <el-form-item label="prop_schema_json"><JsonCodeEditor v-model="form.prop_schema_json" :rows="10" /></el-form-item>
              </div>
              <div class="component-form__field-block">
                <div class="component-form__field-head">
                  <div class="component-form__field-title">样式 / 事件 / 布局 Schema</div>
                  <p class="component-form__field-description">这三块紧跟属性 Schema，用于补齐样式能力、事件能力与布局能力。</p>
                </div>
                <el-form-item label="style_schema_json"><JsonCodeEditor v-model="form.style_schema_json" :rows="10" /></el-form-item>
                <el-form-item label="event_schema_json"><JsonCodeEditor v-model="form.event_schema_json" :rows="8" /></el-form-item>
                <el-form-item label="layout_schema_json"><JsonCodeEditor v-model="form.layout_schema_json" :rows="8" /></el-form-item>
              </div>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">默认值与子节点约束</h3>
              <p class="app-form-section__description">把子节点约束和默认值合并在一组，形成“结构约束 + 默认落地”的完整阅读路径。</p>
              <div class="component-form__field-block">
                <div class="component-form__field-head">
                  <div class="component-form__field-title">子节点约束</div>
                  <p class="component-form__field-description">用于说明当前组件允许承载哪些节点类型，帮助快速判断容器语义。</p>
                </div>
                <el-form-item label="allowed_child_types_json">
                  <JsonCodeEditor v-model="form.allowed_child_types_json" :rows="8" />
                </el-form-item>
              </div>
              <div class="component-form__field-block">
                <div class="component-form__field-head">
                  <div class="component-form__field-title">默认值</div>
                  <p class="component-form__field-description">用于描述组件初始化时的默认 props 与默认样式。</p>
                </div>
                <el-form-item label="default_props_json"><JsonCodeEditor v-model="form.default_props_json" :rows="10" /></el-form-item>
                <el-form-item label="default_style_json"><JsonCodeEditor v-model="form.default_style_json" :rows="10" /></el-form-item>
              </div>
            </section>

            <div class="app-form-actions">
              <el-button type="primary" @click="submit">保存</el-button>
              <el-button @click="$router.back()">返回</el-button>
            </div>
          </el-form>
        </div>
      </el-card>

      <section class="component-form__assist">
        <div class="component-form__assist-header">
          <h3 class="component-form__assist-title">Schema 辅助理解区</h3>
          <p class="component-form__assist-description">这里仅用于辅助阅读当前 Schema 的结构摘要，不替代主表单编辑。</p>
        </div>
        <div class="app-form-stack">
        <SchemaPreviewPanel title="属性 Schema 预览" :value="form.prop_schema_json" />
        <SchemaPreviewPanel title="样式 Schema 预览" :value="form.style_schema_json" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.component-form {
  min-width: 0;
}

.component-form__field-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(219, 229, 240, 0.9);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.component-form__field-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.component-form__field-title {
  color: var(--app-text);
  font-size: 14px;
  font-weight: 700;
}

.component-form__field-description {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.7;
}

.component-form__assist {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.component-form__assist-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.component-form__assist-title {
  margin: 0;
  color: var(--app-text);
  font-size: 15px;
  font-weight: 700;
}

.component-form__assist-description {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.component-form :deep(.schema-panel) {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  box-shadow: var(--app-shadow-sm);
}
</style>
