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
| `home_services` | `HomeServices` | **首页**服务区块 |
| `home_events` | `HomeEvents` | **首页**活动/会议区块 |
| `home_news` | `HomeNews` | **首页**新闻区块（2026-05-30 新增；与子页面 `news_list` 区分） |
| `news_list` | 新闻列表页（成员4待补列表组件，可复用 `HomeNews` 风格） | **子页面**：新闻列表页 |
| `services_page` | 服务矩阵页（Type3 卡片网格，对应 `/services`） | **子页面**：服务矩阵页（2026-05-30 新增） |
| ~~`conference_page`~~ | ~~学术会议页~~ | **已废弃（2026-06-01 成员4确认）**：/conference 暂不启用，改用 `rich_text` 占位；后端 def status=false、白名单/mock 已移除 |
| `home_shortcuts` | `HomeShortcuts` | 快捷导航 |
| `friend_links` | `HomeFriendLinks` | 友情链接 |
| `rich_text` | `AboutStaticArticle` / 文章区块 | 富文本 / 静态文章（正文内容页） |

**不在上表内的 `component_key` 在交付层面视为「未注册」**（见下文章第 3 节）。

---

## 1.5 首页区块 key 与子页面 key 拆分（2026-05-30 语义标准化）

**为什么拆**：此前 `news_list` / `home_services` / `home_events` 同时被「首页 308 区块」与「子页面 309~311」复用，导致同一 `component_key` 在首页与子页面需要映射到**不同**前台组件，语义含糊、易错。本次将二者拆开：

| 场景 | component_key | 用在哪里 | 对应 YAAI 组件 |
|------|---------------|----------|----------------|
| 首页新闻区块 | `home_news` | 首页 308 节点 | `HomeNews`（首页样式） |
| 新闻列表页 | `news_list` | `/news` 309 | 成员4 新增列表页组件（或复用 `HomeNews`） |
| 首页服务区块 | `home_services` | 首页 308 节点 | `HomeServices` |
| 服务矩阵页 | `services_page` | `/services` 310 | 成员4 新增页面组件 |
| 首页活动区块 | `home_events` | 首页 308 节点 | `HomeEvents` |
| ~~学术会议页~~ | ~~`conference_page`~~ | ~~`/conference` 311~~ | **已废弃（2026-06-01）**：/conference 暂不启用，311 改 `rich_text` 占位 |
| 正文内容页 | `rich_text` | `/about/introduction` 312、`/conference` 311（占位） | `RichTextBlock`（Type2） |
| 容器 | `page_container` | 各页根容器 | `LowcodeContainer` |

> **原则**：首页组件用首页 key，子页面组件用页面级 key。后台 `component_def` 与 `yaai-lowcode/src/constants/yaaichannel-component-keys.ts` 均已含全部上述 key。
> **成员4 待补 `component-map` 映射**：`home_news` → HomeNews、`services_page` → 服务矩阵页组件、`conference_page` → 学术会议页组件（在补齐前，这三类节点会走 `UnknownComponent` 兜底，不白屏）。

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
| 2026-05-30 | **语义标准化**：拆分首页区块 key 与子页面 key，新增 `home_news` / `services_page` / `conference_page`（见 §1.5）；`component_def` 已 POST（id 17/18/19，status=true），node-tree 308→`home_news`、310→`services_page`、311→`conference_page`；`src/constants` 与 `src/mock` 已同步（详见 [数据修正执行记录 第十一轮](../05_数据库清洗/数据修正执行记录.md)） |
| 2026-06-01 | **废弃 `conference_page`**（成员4 确认 /conference 暂不启用）：白名单移除、`src/constants` 移除并入 `DEPRECATED_COMPONENT_KEYS`、`src/mock` status:false、后端 `component_def` id19 status=false（未 DELETE）、node-tree 311→`rich_text` 占位（详见 [数据修正执行记录 第十二轮](../05_数据库清洗/数据修正执行记录.md)） |
