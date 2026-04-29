import type { RouteRecordRaw } from 'vue-router'

export const reusableFragmentRoutes: RouteRecordRaw[] = [
  {
    path: '/reusable-fragments',
    name: 'reusable-fragment-list',
    component: () => import('@/views/reusable-fragment/FragmentListView.vue'),
    meta: { title: '可复用片段管理', description: '管理可复用片段（reusable_fragment）' },
  },
  {
    path: '/reusable-fragments/create',
    name: 'reusable-fragment-create',
    component: () => import('@/views/reusable-fragment/FragmentFormView.vue'),
    meta: { title: '新增片段', description: '创建可复用片段（reusable_fragment）' },
  },
  {
    path: '/reusable-fragments/:id/edit',
    name: 'reusable-fragment-edit',
    component: () => import('@/views/reusable-fragment/FragmentFormView.vue'),
    meta: { title: '编辑片段', description: '修改可复用片段（reusable_fragment）' },
  },
]
