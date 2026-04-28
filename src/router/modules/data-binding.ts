import type { RouteRecordRaw } from 'vue-router'

export const dataBindingRoutes: RouteRecordRaw[] = [
  {
    path: '/data-bindings',
    name: 'data-binding-list',
    component: () => import('@/views/data-binding/DataBindingListView.vue'),
    meta: { title: '数据绑定管理', description: '管理 data_binding 实体' },
  },
  {
    path: '/data-bindings/create',
    name: 'data-binding-create',
    component: () => import('@/views/data-binding/DataBindingFormView.vue'),
    meta: { title: '新增数据绑定', description: '新增 data_binding' },
  },
  {
    path: '/data-bindings/:id/edit',
    name: 'data-binding-edit',
    component: () => import('@/views/data-binding/DataBindingFormView.vue'),
    meta: { title: '编辑数据绑定', description: '编辑 data_binding' },
  },
]
