import type { RouteRecordRaw } from 'vue-router'

export const editorRoutes: RouteRecordRaw[] = [
  {
    path: '/pages/:pageId/versions/:versionId/editor',
    name: 'page-editor',
    component: () => import('@/views/editor/PageEditorView.vue'),
    meta: { title: '页面编辑器', description: '围绕页面结构树编辑页面版本（page_node）' },
  },
  {
    path: '/page-templates/:id/editor',
    name: 'template-editor',
    component: () => import('@/views/editor/TemplateEditorView.vue'),
    meta: { title: '模板编辑器', description: '围绕页面结构树编辑页面模板（page_node）' },
  },
  {
    path: '/reusable-fragments/:id/editor',
    name: 'fragment-editor',
    component: () => import('@/views/editor/FragmentEditorView.vue'),
    meta: { title: '片段编辑器', description: '围绕页面结构树编辑可复用片段（page_node）' },
  },
]
