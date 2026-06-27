import type { RouteRecordRaw } from 'vue-router'

export const permissionRoutes: RouteRecordRaw[] = [
  {
    path: '/permission',
    name: 'permission-management',
    component: () => import('@/views/permission/PermissionManagementView.vue'),
    meta: { title: '权限管理', description: '维护系统权限数据（permission）' },
  },
]
