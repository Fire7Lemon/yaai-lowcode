import type { RouteRecordRaw } from 'vue-router'

export const bannerRoutes: RouteRecordRaw[] = [
  {
    path: '/banner-management',
    name: 'banner-management',
    component: () => import('@/views/banner/BannerManagementView.vue'),
    meta: { title: '轮播图管理', description: '维护首页轮播图业务数据（banner）' },
  },
]
