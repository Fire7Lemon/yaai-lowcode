import type { RouteRecordRaw } from 'vue-router'

export const newsCategoryRoutes: RouteRecordRaw[] = [
  {
    path: '/news-categories',
    name: 'news-category-management',
    component: () => import('@/views/news-category/NewsCategoryManagementView.vue'),
    meta: { title: '新闻分类管理', description: '维护新闻分类数据（news_category）' },
  },
]
