<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { createReusableFragment, getReusableFragment, updateReusableFragment } from '@/api/reusable-fragment'
import { FRAGMENT_TYPE_OPTIONS } from '@/constants/page'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const isEdit = computed(() => Number.isFinite(id.value) && id.value > 0)

const form = reactive({
  name: '',
  code: '',
  fragment_type: 'footer_section',
  description: '',
  status: true,
  remark: '',
})

async function load() {
  if (!isEdit.value) {
    return
  }
  const detail = await getReusableFragment(id.value)
  if (!detail) {
    return
  }
  Object.assign(form, {
    ...detail,
    description: detail.description ?? '',
    remark: detail.remark ?? '',
  })
}

async function submit() {
  const payload = {
    ...form,
    fragment_type: form.fragment_type || null,
    description: form.description || null,
    remark: form.remark || null,
  }
  if (isEdit.value) {
    await updateReusableFragment(id.value, payload)
  } else {
    await createReusableFragment(payload)
  }
  ElMessage.success('片段信息已保存')
  router.push('/reusable-fragments')
}

onMounted(load)
</script>

<template>
  <div class="app-page app-form-page fragment-form-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">Reusable Fragment Form</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑可复用片段' : '新建可复用片段' }}</h1>
        <p class="app-page__description">继续复用标准表单页样板，让片段表单与页面表单、模板表单保持统一完成度。</p>
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
              <div class="app-card__title">片段基础信息</div>
              <p class="app-card__description">统一字段分组和底部操作区，提升可复用片段表单页的稳定性。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="110px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">片段字段</h3>
              <p class="app-form-section__description">使用统一骨架承载片段名称、编码、类型和状态。</p>
              <div class="app-form-grid">
                <el-form-item label="片段名称"><el-input v-model="form.name" /></el-form-item>
                <el-form-item label="片段编码"><el-input v-model="form.code" /></el-form-item>
                <el-form-item label="片段类型">
                  <el-select v-model="form.fragment_type">
                    <el-option v-for="item in FRAGMENT_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">补充说明</h3>
              <p class="app-form-section__description">长文本集中承载，避免表单页只有一列输入框导致页面发空。</p>
              <el-form-item label="片段说明"><el-input v-model="form.description" type="textarea" :rows="4" /></el-form-item>
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
.fragment-form-view {
  min-width: 0;
}
</style>
