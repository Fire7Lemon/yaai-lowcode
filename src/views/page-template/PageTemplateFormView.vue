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

const sceneTypeLabelMap: Record<string, string> = {
  portal_home: '首页场景',
  news_channel: '新闻列表场景',
  single_page: '通用内容页场景',
  landing_page: '专题页场景',
}

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
        <div class="app-page__eyebrow">整页模板配置</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑页面模板' : '新建页面模板' }}</h1>
        <p class="app-page__description">模板是页面搭建的整页起点，可用于快速创建页面版本。</p>
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
              <p class="app-card__description">请先完成模板名称、适用场景和预览信息，便于后续复用。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="110px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">模板字段</h3>
              <p class="app-form-section__description">用于定义模板基础信息与适用范围。</p>
              <div class="app-form-grid">
                <el-form-item label="模板名称"><el-input v-model="form.name" placeholder="例如：官网首页模板" /></el-form-item>
                <el-form-item label="模板编码"><el-input v-model="form.code" placeholder="例如：official-home-template" /></el-form-item>
                <el-form-item label="适用场景">
                  <el-select v-model="form.scene_type">
                    <el-option
                      v-for="item in PAGE_TEMPLATE_SCENE_OPTIONS"
                      :key="item"
                      :label="sceneTypeLabelMap[item] ?? item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
              <el-form-item label="预览图"><el-input v-model="form.preview_image" placeholder="请输入预览图链接（可选）" /></el-form-item>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">说明信息</h3>
              <p class="app-form-section__description">可说明模板用途与适用页面类型，方便团队复用。</p>
              <el-form-item label="模板说明">
                <el-input v-model="form.description" type="textarea" :rows="4" placeholder="例如：适用于官网首页，含首屏、资讯、公告与联系区块" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="可填写维护说明" />
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
.template-form-view {
  min-width: 0;
}
</style>
