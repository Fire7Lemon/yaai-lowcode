import type { RouteRecordRaw } from 'vue-router'

export const menuRoutes: RouteRecordRaw[] = [
  {
    path: '/menus',
    name: 'menu-management',
    component: () => import('@/views/menu/MenuManagementView.vue'),
    meta: { title: '菜单管理', description: '围绕 menu 管理导航关系' },
  },
]
