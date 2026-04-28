<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { createPageTemplate, getPageTemplate, updatePageTemplate } from '@/api/page-template'
import { PAGE_TEMPLATE_SCENE_OPTIONS } from '@/constants/page'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const isEdit = computed(() => Number.isFinite(id.value) && id.value > 0)

const form = reactive({
  name: '',
  code: '',
  scene_type: 'portal_home',
  preview_image: '',
  description: '',
  status: true,
  remark: '',
})

async function load() {
  if (!isEdit.value) {
    return
  }
  const detail = await getPageTemplate(id.value)
  if (!detail) {
    return
  }
  Object.assign(form, {
    ...detail,
    preview_image: detail.preview_image ?? '',
    description: detail.description ?? '',
    remark: detail.remark ?? '',
  })
}

async function submit() {
  const payload = {
    ...form,
    scene_type: form.scene_type || null,
    preview_image: form.preview_image || null,
    description: form.description || null,
    remark: form.remark || null,
  }
  if (isEdit.value) {
    await updatePageTemplate(id.value, payload)
  } else {
    await createPageTemplate(payload)
  }
  ElMessage.success('模板信息已保存')
  router.push('/page-templates')
}

onMounted(load)
</script>

<template>
  <div class="app-page app-form-page template-form-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">Page Template Form</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑页面模板' : '新建页面模板' }}</h1>
        <p class="app-page__description">复用 `PageFormView` 的标准表单页样板，只在字段内容上保持模板语义差异。</p>
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
              <div class="app-card__title">模板基础信息</div>
              <p class="app-card__description">在统一骨架中承载模板名称、场景、预览图和说明字段。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="110px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">模板字段</h3>
              <p class="app-form-section__description">保持原字段顺序，增强宽度利用和表单层次。</p>
              <div class="app-form-grid">
                <el-form-item label="模板名称"><el-input v-model="form.name" /></el-form-item>
                <el-form-item label="模板编码"><el-input v-model="form.code" /></el-form-item>
                <el-form-item label="场景类型">
                  <el-select v-model="form.scene_type">
                    <el-option v-for="item in PAGE_TEMPLATE_SCENE_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
              <el-form-item label="预览图"><el-input v-model="form.preview_image" /></el-form-item>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">说明信息</h3>
              <p class="app-form-section__description">长文本字段集中放置，保证页面不再显得窄而空。</p>
              <el-form-item label="模板说明"><el-input v-model="form.description" type="textarea" :rows="4" /></el-form-item>
              <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="4" /></el-form-item>
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
.template-form-view {
  min-width: 0;
}
</style>
