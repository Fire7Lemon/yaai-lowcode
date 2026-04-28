import type { RouteRecordRaw } from 'vue-router'

export const pageTemplateRoutes: RouteRecordRaw[] = [
  {
    path: '/page-templates',
    name: 'page-template-list',
    component: () => import('@/views/page-template/PageTemplateListView.vue'),
    meta: { title: '页面模板管理', description: '管理 page_template 实体' },
  },
  {
    path: '/page-templates/create',
    name: 'page-template-create',
    component: () => import('@/views/page-template/PageTemplateFormView.vue'),
    meta: { title: '新增页面模板', description: '新增 page_template' },
  },
  {
    path: '/page-templates/:id/edit',
    name: 'page-template-edit',
    component: () => import('@/views/page-template/PageTemplateFormView.vue'),
    meta: { title: '编辑页面模板', description: '编辑 page_template' },
  },
]
