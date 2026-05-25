# component_key 白名单（冻结）

> **状态：冻结。** 成员 3 配置低代码、成员 4 编写 `component-map.ts` 均以本文件为唯一权威来源。  
> **命名规则**：`component_key` 必须**全小写**、**snake_case**，仅使用字母、数字与下划线（业务上建议仅用字母+下划线）。

---

## 1. 正式白名单（与 YAAI 区块一一对应）

| component_key | 对应 YAAI 前台区块 / 组件 | 说明 |
|---------------|---------------------------|------|
| `page_container` | 页面根容器 | 根容器；`node_type` 一般为容器 |
| `hero_banner` | `HomeCarousel` | 首页轮播 |
| `notice_list` | `HomeNotice` | 通知公告 |
| `quick_links` | `HomeQuickLinks` | 快捷入口 |
| `home_services` | `HomeServices` | 服务矩阵 |
| `home_events` | `HomeEvents` | 活动预告 |
| `news_list` | `HomeNews` | 新闻列表 |
| `home_shortcuts` | `HomeShortcuts` | 快捷导航 |
| `friend_links` | `HomeFriendLinks` | 友情链接 |
| `rich_text` | `AboutStaticArticle` / 文章区块 | 富文本 / 静态文章 |

**不在上表内的 `component_key` 在交付层面视为「未注册」**（见下文章第 3 节）。

---

## 2. 历史别名（不得用于新配置）

以下键名仅可能出现在**历史数据、旧文档或 mock** 中，**不进入正式白名单**，新配的节点请迁移到上表：

| 历史别名 | 统一为 |
|----------|--------|
| `service_matrix` | `home_services` |
| `event_list` | `home_events` |

其他历史键（如编辑器里曾用的布局容器 `hero_split_container` 等）若库中仍存在，由「数据清洗 / 节点迁移」专项处理，**新增页面节点不得再引入未列入白名单的键**（根容器仅使用 `page_container`）。

---

## 3. 成员 4：`component-map.ts` 约定

1. **映射表仅导出本白名单中的 `component_key`** 到 Vue 组件；解析路由或 `page_node` 时以此为唯一合法集合。  
2. **未知 `component_key`**：必须渲染 **`UnknownComponent`**（或等价兜底 UI），**不得**因未知键抛错导致整页白屏。  
3. **props**：从 `props_json` 解析后的字段由各 Vue 组件自行约束；与白名单配套的默认 schema 建议在后台 `component_def` 中维护。

---

## 4. 与后台 `component_def` 的关系

- 数据库表 **`component_def.component_key`** 与上表**逐字一致**（含下划线）。  
- 若存在白名单外记录：列为**清洗或改名**对象，见 [数据库清洗候选清单.md](../05_数据库清洗/数据库清洗候选清单.md)，**禁止自动删除**需引用的定义。

---

## 5. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-20 | 首版冻结白名单；废弃 `service_matrix` / `event_list` 二选一，统一为 `home_services` / `home_events` |
| 2026-05-20 | `yaai-lowcode`：`src/constants/yaaichannel-component-keys.ts` 与此表顺序对齐；编辑器与 mock 沿用本表（见 `低代码数据对齐计划` §10、《数据库清洗计划》§12） |
