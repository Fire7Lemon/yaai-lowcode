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

const fragmentTypeLabelMap: Record<string, string> = {
  header_section: '顶部区块',
  footer_section: '底部区块',
  hero_section: '首屏区块',
  news_section: '资讯区块',
  links_section: '链接区块',
}

async function load() {
  if (!isEdit.value) {
    return
  }
  try {
    const detail = await getReusableFragment(id.value)
    if (!detail) {
      ElMessage.warning('未找到片段')
      return
    }
    Object.assign(form, {
      name: detail.name,
      code: detail.code,
      fragment_type: detail.fragment_type ?? 'footer_section',
      description: detail.description ?? '',
      status: detail.status,
      remark: detail.remark ?? '',
    })
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '片段加载失败')
  }
}

async function submit() {
  const payload = {
    name: form.name.trim(),
    code: form.code.trim(),
    fragment_type: form.fragment_type ? form.fragment_type : null,
    description: form.description.trim() ? form.description.trim() : null,
    status: form.status,
    remark: form.remark.trim() ? form.remark.trim() : null,
  }
  if (!payload.name) {
    ElMessage.warning('请填写片段名称')
    return
  }
  if (!payload.code) {
    ElMessage.warning('请填写片段编码')
    return
  }

  try {
    if (isEdit.value) {
      await updateReusableFragment(id.value, payload)
    } else {
      await createReusableFragment(payload)
    }
    ElMessage.success('片段信息已保存')
    router.push('/reusable-fragments')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="app-page app-form-page fragment-form-view">
    <section class="app-page__header">
      <div class="app-page__title-group">
        <div class="app-page__eyebrow">局部复用配置</div>
        <h1 class="app-page__title">{{ isEdit ? '编辑可复用片段' : '新建可复用片段' }}</h1>
        <p class="app-page__description">片段用于跨页面复用局部内容，减少重复维护。</p>
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
              <p class="app-card__description">请先完成片段名称、类型和说明，便于在页面结构树中引用。</p>
            </div>
          </div>
        </template>
        <div class="app-form-card__body">
          <el-form label-width="110px">
            <section class="app-form-section">
              <h3 class="app-form-section__title">片段字段</h3>
              <p class="app-form-section__description">用于定义可复用片段的基础属性。</p>
              <div class="app-form-grid">
                <el-form-item label="片段名称"><el-input v-model="form.name" placeholder="例如：全站页脚片段" /></el-form-item>
                <el-form-item label="片段编码"><el-input v-model="form.code" placeholder="例如：global-footer-fragment" /></el-form-item>
                <el-form-item label="片段类型">
                  <el-select v-model="form.fragment_type">
                    <el-option
                      v-for="item in FRAGMENT_TYPE_OPTIONS"
                      :key="item"
                      :label="fragmentTypeLabelMap[item] ?? item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态"><el-switch v-model="form.status" /></el-form-item>
              </div>
            </section>

            <section class="app-form-section">
              <h3 class="app-form-section__title">补充说明</h3>
              <p class="app-form-section__description">建议写明片段复用场景，方便其他页面直接引用。</p>
              <el-form-item label="片段说明">
                <el-input v-model="form.description" type="textarea" :rows="4" placeholder="例如：用于所有页面底部版权和联系方式展示" />
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
.fragment-form-view {
  min-width: 0;
}
</style>
