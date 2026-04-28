import type { RouteRecordRaw } from 'vue-router'

export const editorRoutes: RouteRecordRaw[] = [
  {
    path: '/pages/:pageId/versions/:versionId/editor',
    name: 'page-editor',
    component: () => import('@/views/editor/PageEditorView.vue'),
    meta: { title: '页面编辑器', description: '围绕 page_node 的版本编辑器' },
  },
  {
    path: '/page-templates/:id/editor',
    name: 'template-editor',
    component: () => import('@/views/editor/TemplateEditorView.vue'),
    meta: { title: '模板编辑器', description: '围绕 page_node 的模板编辑器' },
  },
  {
    path: '/reusable-fragments/:id/editor',
    name: 'fragment-editor',
    component: () => import('@/views/editor/FragmentEditorView.vue'),
    meta: { title: '片段编辑器', description: '围绕 page_node 的片段编辑器' },
  },
]
