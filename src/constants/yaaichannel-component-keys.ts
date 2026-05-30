/**
 * 与 YAAI 前台约定的正式 component_key 展示顺序。
 * 唯一权威仍为 docs/01_设计基线/component_key白名单.md。
 *
 * 语义标准化（2026-05-30）：首页区块 key 与子页面 key 拆开，避免同一 key 在首页/子页面映射不同组件。
 * - 首页区块：home_news / home_services / home_events（首页 308 内的业务区块）
 * - 子页面：news_list（新闻列表页）/ services_page（服务矩阵页）/ conference_page（学术会议页）
 */
export const YAAI_OFFICIAL_COMPONENT_KEYS = [
  'page_container',
  'hero_banner',
  'notice_list',
  'quick_links',
  'home_services',
  'home_events',
  'home_news',
  'news_list',
  'services_page',
  'conference_page',
  'home_shortcuts',
  'friend_links',
  'rich_text',
] as const

export type YaaichannelOfficialComponentKey = (typeof YAAI_OFFICIAL_COMPONENT_KEYS)[number]

const OFFICIAL_SET = new Set<string>(YAAI_OFFICIAL_COMPONENT_KEYS)

export const YAAI_OFFICIAL_COMPONENT_KEY_SET: ReadonlySet<string> = OFFICIAL_SET

export function isYaaichannelOfficialComponentKey(key: string | null | undefined): key is YaaichannelOfficialComponentKey {
  return typeof key === 'string' && OFFICIAL_SET.has(key)
}
