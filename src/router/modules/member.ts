import type { RouteRecordRaw } from 'vue-router'

export const memberRoutes: RouteRecordRaw[] = [
  {
    path: '/member-audit',
    name: 'member-audit',
    component: () => import('@/views/member-audit/MemberAuditListView.vue'),
    meta: { title: '会员审核', description: '管理个人与单位会员待审核记录' },
  },
  {
    path: '/member-orders',
    name: 'member-orders',
    component: () => import('@/views/member-order/MemberOrderListView.vue'),
    meta: { title: '会员订单查看', description: '按会员ID查询订单记录（受当前接口能力限制）' },
  },
]
