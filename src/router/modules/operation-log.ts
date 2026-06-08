import type { RouteRecordRaw } from 'vue-router'

export const operationLogRoutes: RouteRecordRaw[] = [
  {
    path: '/log',
    name: 'operation-log-management',
    component: () => import('@/views/operation-log/OperationLogManagementView.vue'),
    meta: { title: '操作日志管理', description: '查看与删除系统操作日志（operation_log）' },
  },
]
