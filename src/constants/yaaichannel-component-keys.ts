/**
 * 与 YAAI 前台约定的正式 component_key 展示顺序。
 * 唯一权威仍为 docs/01_设计基线/component_key白名单.md。
 */
export const YAAI_OFFICIAL_COMPONENT_KEYS = [
  'page_container',
  'hero_banner',
  'notice_list',
  'quick_links',
  'home_services',
  'home_events',
  'news_list',
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
