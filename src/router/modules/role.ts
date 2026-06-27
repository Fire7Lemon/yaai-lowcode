import type { RouteRecordRaw } from 'vue-router'

export const roleRoutes: RouteRecordRaw[] = [
  {
    path: '/role',
    name: 'role-management',
    component: () => import('@/views/role/RoleManagementView.vue'),
    meta: { title: '角色管理', description: '维护系统角色与权限关系（role）' },
  },
]
