import type { RouteRecordRaw } from 'vue-router'

export const componentDefRoutes: RouteRecordRaw[] = [
  {
    path: '/component-defs',
    name: 'component-def-list',
    component: () => import('@/views/component-def/ComponentDefListView.vue'),
    meta: { title: '组件定义管理', description: '查看与维护组件定义（component_def）' },
  },
  {
    path: '/component-defs/create',
    name: 'component-def-create',
    component: () => import('@/views/component-def/ComponentDefFormView.vue'),
    meta: { title: '新增组件定义', description: '创建组件定义（component_def）' },
  },
  {
    path: '/component-defs/:id/edit',
    name: 'component-def-edit',
    component: () => import('@/views/component-def/ComponentDefFormView.vue'),
    meta: { title: '编辑组件定义', description: '修改组件定义（component_def）' },
  },
]
