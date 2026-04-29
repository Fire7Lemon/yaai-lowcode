import type { RouteRecordRaw } from 'vue-router'

export const pageRoutes: RouteRecordRaw[] = [
  {
    path: '/pages',
    name: 'page-list',
    component: () => import('@/views/page/PageListView.vue'),
    meta: { title: '页面管理', description: '管理页面基础信息（page）' },
  },
  {
    path: '/pages/create',
    name: 'page-create',
    component: () => import('@/views/page/PageFormView.vue'),
    meta: { title: '新增页面', description: '创建页面基础信息（page）' },
  },
  {
    path: '/pages/:id/edit',
    name: 'page-edit',
    component: () => import('@/views/page/PageFormView.vue'),
    meta: { title: '编辑页面', description: '修改页面基础信息（page）' },
  },
  {
    path: '/pages/:id/versions',
    name: 'page-version-list',
    component: () => import('@/views/page-version/PageVersionListView.vue'),
    meta: { title: '页面版本管理', description: '管理页面版本与发布状态（page_version）' },
  },
]
