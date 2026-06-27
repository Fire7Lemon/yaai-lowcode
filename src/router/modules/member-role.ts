import type { RouteRecordRaw } from 'vue-router'

export const memberRoleRoutes: RouteRecordRaw[] = [
  {
    path: '/member-role',
    name: 'member-role-assignment',
    component: () => import('@/views/member-role/MemberRoleAssignmentView.vue'),
    meta: { title: '会员角色分配', description: '维护会员与角色绑定关系（member_role）' },
  },
]
