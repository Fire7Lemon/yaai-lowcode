import type { RouteRecordRaw } from 'vue-router'

export const menuRoutes: RouteRecordRaw[] = [
  {
    path: '/menus',
    name: 'menu-management',
    component: () => import('@/views/menu/MenuManagementView.vue'),
    meta: { title: '菜单管理', description: '管理导航层级与页面映射（menu）' },
  },
]
