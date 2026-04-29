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
        <div class="app-page__eyebrow">页面基础信息</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑页面' : '新建页面' }}</h1>
        <p class="app-page__description">
          用于维护页面基础信息，保存后可进入版本管理继续编辑与发布。
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
              <p class="app-card__description">请先完成名称、编码、访问路径等核心信息，再进入版本链路。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="110px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">基础字段</h3>
              <p class="app-form-section__description">用于定义页面标识、访问路径和页面类型。</p>
              <div class="app-form-grid">
                <el-form-item label="页面名称"><el-input v-model="form.name" placeholder="例如：学校首页" /></el-form-item>
                <el-form-item label="页面编码"><el-input v-model="form.code" placeholder="例如：school-home" /></el-form-item>
                <el-form-item label="访问路径"><el-input v-model="form.path" placeholder="例如：/home" /></el-form-item>
                <el-form-item label="页面类型">
                  <el-select v-model="form.page_type">
                    <el-option v-for="item in PAGE_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="页面标题"><el-input v-model="form.title" placeholder="用于页面抬头展示" /></el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">SEO 与补充说明</h3>
              <p class="app-form-section__description">用于搜索展示和运营备注，可按需填写。</p>
              <el-form-item label="SEO 标题"><el-input v-model="form.seo_title" placeholder="可选" /></el-form-item>
              <el-form-item label="SEO 关键词"><el-input v-model="form.seo_keywords" placeholder="可选，多个关键词可用逗号分隔" /></el-form-item>
              <el-form-item label="SEO 描述">
                <el-input v-model="form.seo_description" type="textarea" :rows="4" placeholder="可选" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="记录页面用途或维护说明" />
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
