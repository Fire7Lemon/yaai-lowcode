<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { createPage, getPage, updatePage } from '@/api/page'
import { PAGE_TYPE_OPTIONS } from '@/constants/page'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const isEdit = computed(() => Number.isFinite(id.value) && id.value > 0)

const form = reactive({
  name: '',
  code: '',
  path: '',
  page_type: 'portal',
  title: '',
  status: true,
  seo_title: '',
  seo_keywords: '',
  seo_description: '',
  remark: '',
})

async function load() {
  if (!isEdit.value) {
    return
  }
  const detail = await getPage(id.value)
  if (!detail) {
    return
  }
  Object.assign(form, {
    ...detail,
    seo_title: detail.seo_title ?? '',
    seo_keywords: detail.seo_keywords ?? '',
    seo_description: detail.seo_description ?? '',
    remark: detail.remark ?? '',
  })
}

async function submit() {
  const payload = {
    ...form,
    title: form.title || null,
    seo_title: form.seo_title || null,
    seo_keywords: form.seo_keywords || null,
    seo_description: form.seo_description || null,
    remark: form.remark || null,
  }

  if (isEdit.value) {
    await updatePage(id.value, payload)
  } else {
    await createPage(payload)
  }

  ElMessage.success('页面信息已保存')
  router.push('/pages')
}

onMounted(load)
</script>

<template>
  <div class="app-page app-form-page page-form-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">Page Form</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑页面' : '新建页面' }}</h1>
        <p class="app-page__description">
          标准表单页样板：统一页面头部、主表单卡片、字段分组与底部操作区，后续将复用于模板页和片段页。
        </p>
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
              <div class="app-card__title">页面基础信息</div>
              <p class="app-card__description">保持字段顺序不变，只通过统一分组和宽度承载提升表单页完成度。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="110px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">基础字段</h3>
              <p class="app-form-section__description">用于定义页面主键标识、访问路径和类型。</p>
              <div class="app-form-grid">
                <el-form-item label="页面名称"><el-input v-model="form.name" /></el-form-item>
                <el-form-item label="页面编码"><el-input v-model="form.code" /></el-form-item>
                <el-form-item label="访问路径"><el-input v-model="form.path" /></el-form-item>
                <el-form-item label="页面类型">
                  <el-select v-model="form.page_type">
                    <el-option v-for="item in PAGE_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="页面标题"><el-input v-model="form.title" /></el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">SEO 与补充说明</h3>
              <p class="app-form-section__description">较长文本字段集中承载，避免页面显得过窄、过空。</p>
              <el-form-item label="SEO 标题"><el-input v-model="form.seo_title" /></el-form-item>
              <el-form-item label="SEO 关键词"><el-input v-model="form.seo_keywords" /></el-form-item>
              <el-form-item label="SEO 描述">
                <el-input v-model="form.seo_description" type="textarea" :rows="4" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="4" />
              </el-form-item>
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
.page-form-view {
  min-width: 0;
}
</style>
