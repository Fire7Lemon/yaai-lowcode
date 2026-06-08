import type { RouteRecordRaw } from 'vue-router'

export const newsRoutes: RouteRecordRaw[] = [
  {
    path: '/news',
    name: 'news-management',
    component: () => import('@/views/news/NewsManagementView.vue'),
    meta: { title: '新闻管理', description: '维护新闻数据（news）' },
  },
]
