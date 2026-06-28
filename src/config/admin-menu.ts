export type ActivePathMatcher = (currentPath: string) => boolean

export interface AdminMenuChild {
  key: string
  title: string
  path: string
  description?: string
  icon?: string
  showInSidebar: boolean
  showInWorkbench: boolean
  activeMatchers?: ActivePathMatcher[]
}

export interface AdminMenuGroup {
  key: string
  title: string
  icon?: string
  collapsible: boolean
  children: AdminMenuChild[]
}

export const WORKBENCH_MENU_ITEM: AdminMenuChild = {
  key: 'workbench',
  title: '工作台',
  path: '/workbench',
  showInSidebar: true,
  showInWorkbench: false,
  activeMatchers: [(path) => path === '/workbench'],
}

function exactPath(path: string): ActivePathMatcher {
  return (currentPath) => currentPath === path
}

function prefixPath(path: string): ActivePathMatcher {
  return (currentPath) => currentPath === path || currentPath.startsWith(`${path}/`)
}

export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    key: 'lowcode',
    title: '页面与低代码',
    collapsible: true,
    children: [
      {
        key: 'pages',
        title: '页面管理',
        path: '/pages',
        description: '管理页面与页面版本（page / page_version）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [prefixPath('/pages')],
      },
      {
        key: 'page-templates',
        title: '页面模板',
        path: '/page-templates',
        description: '管理整页模板（page_template）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [prefixPath('/page-templates')],
      },
      {
        key: 'reusable-fragments',
        title: '可复用片段',
        path: '/reusable-fragments',
        description: '管理可复用片段（reusable_fragment）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [prefixPath('/reusable-fragments')],
      },
      {
        key: 'menus',
        title: '菜单管理',
        path: '/menus',
        description: '维护导航菜单与页面映射（menu）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/menus')],
      },
      {
        key: 'component-defs',
        title: '组件定义',
        path: '/component-defs',
        description: '管理组件配置中心（component_def）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [prefixPath('/component-defs')],
      },
      {
        key: 'data-bindings',
        title: '数据绑定',
        path: '/data-bindings',
        description: '管理数据绑定配置（data_binding）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [prefixPath('/data-bindings')],
      },
    ],
  },
  {
    key: 'content',
    title: '内容运营',
    collapsible: true,
    children: [
      {
        key: 'banner-management',
        title: '轮播图管理',
        path: '/banner-management',
        description: '维护首页轮播图业务数据（banner）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/banner-management')],
      },
      {
        key: 'news',
        title: '新闻管理',
        path: '/news',
        description: '维护新闻内容数据（news），支持查询与增删改查。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/news')],
      },
      {
        key: 'news-categories',
        title: '新闻分类管理',
        path: '/news-categories',
        description: '维护新闻分类数据（news_category）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [prefixPath('/news-categories')],
      },
    ],
  },
  {
    key: 'member',
    title: '会员管理',
    collapsible: true,
    children: [
      {
        key: 'member-audit',
        title: '会员审核',
        path: '/member-audit',
        description: '查看并处理个人/单位会员待审核记录。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/member-audit')],
      },
      {
        key: 'member-orders',
        title: '会员订单查看',
        path: '/member-orders',
        description: '按 memberId 查询订单，受后端接口能力限制。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/member-orders')],
      },
      {
        key: 'member-role',
        title: '会员角色分配',
        path: '/member-role',
        description: '按 memberId 分配和清理角色（member_role）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/member-role')],
      },
    ],
  },
  {
    key: 'system',
    title: '权限与系统',
    collapsible: true,
    children: [
      {
        key: 'operation-log',
        title: '操作日志管理',
        path: '/log',
        description: '查看系统操作日志并支持删除记录（operation_log）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/log')],
      },
      {
        key: 'permission',
        title: '权限管理',
        path: '/permission',
        description: '维护系统权限数据（permission）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/permission')],
      },
      {
        key: 'role',
        title: '角色管理',
        path: '/role',
        description: '维护角色及其权限绑定（role）。',
        showInSidebar: true,
        showInWorkbench: true,
        activeMatchers: [exactPath('/role')],
      },
    ],
  },
]

function getAllMenuChildren(): AdminMenuChild[] {
  return ADMIN_MENU_GROUPS.flatMap((group) => group.children)
}

export function isMenuItemActive(item: AdminMenuChild, currentPath: string): boolean {
  if (item.activeMatchers?.length) {
    return item.activeMatchers.some((matcher) => matcher(currentPath))
  }
  return currentPath === item.path || currentPath.startsWith(`${item.path}/`)
}

export function getActiveMenuPath(currentPath: string): string | null {
  if (isMenuItemActive(WORKBENCH_MENU_ITEM, currentPath)) {
    return WORKBENCH_MENU_ITEM.path
  }

  for (const child of getAllMenuChildren()) {
    if (isMenuItemActive(child, currentPath)) {
      return child.path
    }
  }

  return null
}

export function getActiveGroupKey(currentPath: string): string | null {
  if (isMenuItemActive(WORKBENCH_MENU_ITEM, currentPath)) {
    return null
  }

  for (const group of ADMIN_MENU_GROUPS) {
    if (group.children.some((child) => isMenuItemActive(child, currentPath))) {
      return group.key
    }
  }

  return null
}

export function getSidebarMenuGroups(): AdminMenuGroup[] {
  return ADMIN_MENU_GROUPS.map((group) => ({
    ...group,
    children: group.children.filter((child) => child.showInSidebar),
  })).filter((group) => group.children.length > 0)
}

export function getWorkbenchCards(): AdminMenuChild[] {
  return ADMIN_MENU_GROUPS.flatMap((group) =>
    group.children.filter((child) => child.showInWorkbench),
  )
}
