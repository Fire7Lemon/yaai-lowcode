import type { RouteRecordRaw } from 'vue-router'

export const pageRoutes: RouteRecordRaw[] = [
  {
    path: '/pages',
    name: 'page-list',
    component: () => import('@/views/page/PageListView.vue'),
    meta: { title: '页面管理', description: '管理 page 表的元信息' },
  },
  {
    path: '/pages/create',
    name: 'page-create',
    component: () => import('@/views/page/PageFormView.vue'),
    meta: { title: '新增页面', description: '新增 page 元信息' },
  },
  {
    path: '/pages/:id/edit',
    name: 'page-edit',
    component: () => import('@/views/page/PageFormView.vue'),
    meta: { title: '编辑页面', description: '编辑 page 元信息' },
  },
  {
    path: '/pages/:id/versions',
    name: 'page-version-list',
    component: () => import('@/views/page-version/PageVersionListView.vue'),
    meta: { title: '页面版本管理', description: '围绕 page_version 维护页面版本' },
  },
]
