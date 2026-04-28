import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import AdminLayout from '@/layouts/AdminLayout.vue'

import { componentDefRoutes } from './modules/component-def'
import { dataBindingRoutes } from './modules/data-binding'
import { editorRoutes } from './modules/editor'
import { menuRoutes } from './modules/menu'
import { pageRoutes } from './modules/page'
import { pageTemplateRoutes } from './modules/page-template'
import { reusableFragmentRoutes } from './modules/reusable-fragment'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: '/workbench',
      },
      {
        path: 'workbench',
        name: 'workbench',
        component: () => import('@/views/dashboard/WorkbenchView.vue'),
        meta: {
          title: '工作台',
          description: '查看项目当前实现范围、接口草案与编辑器入口',
        },
      },
      ...pageRoutes,
      ...pageTemplateRoutes,
      ...reusableFragmentRoutes,
      ...componentDefRoutes,
      ...dataBindingRoutes,
      ...menuRoutes,
      ...editorRoutes,
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
