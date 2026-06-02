> **执行状态（成员3，2026-06-02 定稿）**：
> - ✅ 废弃 `conference_page`：白名单/mock 移除、后端 `component_def` id19 status=false（未 DELETE）。
> - ✅ `/conference`（version 311）已改为 `rich_text` 占位（后端缺接口暂不启用）。
> - ✅ 保持：/news=`news_list`(Type1)、/services=`services_page`(Type3)、/about/introduction=`rich_text`(Type2)、首页 `home_*`；`news.categoryId`(1/2/3) 与 show-list 过滤不变。
> - ✅ **新闻分类归属已定稿：方案 B** —— 复用 `news_category.parentId` 表示所属菜单 id（`menus.id`）。
> - ⚠️ **方案 B 尚未落地数据**：后端 schema 仍为自关联外键，`PUT parentId=11` 返回 `DATA_CONFLICT`；**parentId=11 尚未写入成功**（待后端修复后由成员3受控写入）。
> - 📋 **方案 A**：不再作为当前执行方案，仅作后端未修复前的临时降级（读全部分类、不按 parentId 筛）。
> - 📋 **方案 C**：长期规范方案（新增 `owner_menu_id`/`channel_code`），**不作为当前项目执行方案**。
> - 🔒 **铁律**：**不要把 `menu.id` 当作 `category_id`**；`category_id` **只能传 `news_category.id`**（1/2/3）。
> - ⏸ 单篇文章分类（Type2/Type4，可选）：本轮未新增。
> - 详见 [数据修正执行记录 第十二轮](../05_数据库清洗/数据修正执行记录.md)、[新闻分类对应关系报告 §15](../新闻分类与新闻数据对应关系检查报告.md)、[后端待修复清单 §11](../04_后端修复/后端待修复清单.md)。

# 展示端 → 成员3 对接说明（Type 页面 & 分类数据）

> 展示端（成员2）当前低代码子页组件已收敛为 **Type1 / Type2 / Type3** 三种页面形态。  
> 请按本文调整 **componentKey、node-tree、menus、news-categories** 配置，无需再维护 `conference_page`。

---

## 1. 废弃 `conference_page`

**结论：`conference_page` 键名不再需要。**

- 展示端后续会从 `component-map` 中移除 `conference_page` → `ConferencePage.vue` 映射。
- `/conference` 等页面请改用与其它子页一致的 node-tree 配置（见下方 Type 说明），**不要**再新增 `conference_page` 节点。
- 首页活动 teaser 仍用既有键名 **`home_events`**（`HomeEvents.vue`），与会议完整子页分离。

---

## 2. Type1 / Type2 / Type3 三种子页组件

| 前端文件 | componentKey（后台键名） | 页面形态 | 用途说明 |
|----------|-------------------------|----------|----------|
| `Type1.vue` | **`news_list`** | **侧栏 + 列表** | 新闻/通知类**栏目页**：左侧为分类 Tab（数据来自 `GET /news-categories`），右侧为当前分类下的新闻列表（`GET /news/show-list?category_id=N`）。典型页面：`/news`。 |
| `Type2.vue` | **`rich_text`** | **单篇文章** | **整页只展示一篇文章**：标题、摘要、作者、发布时间、封面、HTML 正文。无侧栏、无列表。典型页面：`/about/introduction` 等静态/介绍类正文页。 |
| `Type3.vue` | **`services_page`** | **块状卡片网格** | **无侧栏**：顶部分类 Tab + 下方**卡片块**展示条目（字段结构与 `GET /news` 单条 JSON 一致：title、summary、coverImage、author、publishTime、viewCount 等）。典型页面：`/services`。 |

### 与首页区块键名区分（勿混用）

| componentKey | 组件 | 场景 |
|--------------|------|------|
| `home_news` | `HomeNews.vue` | 首页新闻双栏 teaser |
| `home_services` | `HomeServices.vue` | 首页服务四宫格 teaser |
| `home_events` | `HomeEvents.vue` | 首页活动 teaser |

**原则：** 首页用 `home_*`；完整子页用 `news_list` / `rich_text` / `services_page`（Type1/2/3）。

### node-tree 配置示例（示意）

```
/news 页面 node-tree 根节点下：
  └── componentKey: news_list   → 渲染 Type1

/about/introduction 页面：
  └── componentKey: rich_text   → 渲染 Type2

/services 页面：
  └── componentKey: services_page → 渲染 Type3
```

Type1 节点可继续绑定 `dataBindingId`（值为 **`news_category.id`**，见第 3 节），用于默认选中分类。

---

## 3. 子菜单与分类数据：`/news-categories` + `/news/show-list`

### 3.1 子菜单数据来源

**页面侧栏 / 顶部分类 Tab 的子菜单项，统一来自 `GET /news-categories`。**

当前有效分类示例：

| id | name | code | sortOrder |
|----|------|------|-----------|
| 1 | 学会新闻 | news_category_xhxw | 1 |
| 2 | 通知公告 | notice_category | 2 |
| 3 | 学术动态 | academic_news | 3 |

展示端用法：

- 用 **`id`** 作为 Tab/侧栏项标识；
- 路由 query 示例：`/news?category_id=1`；
- 切换分类后，列表请求：`GET /news/show-list?category_id=1`（**不要用 `menu.id`**）。

### 3.2 列表数据：`categoryId` 与 `news_category.id` 对应

`GET /news/show-list` 返回项中：

```json
{
  "id": 5,
  "categoryId": 3,
  "title": "最新研究：人工智能在医学中的应用",
  "summary": "由学会专家团队完成的最新研究报告发布……",
  "content": "<p>报告详情</p>",
  "coverImage": "/images/news3.jpg",
  "publishTime": "2026-04-12T16:00:00",
  "source": "研究部",
  "author": "孙七",
  "status": true,
  "isTop": false,
  "viewCount": 2111
}
```

**真实关系：**

```
news.categoryId  →  news_category.id
```

- `categoryId = 3` 表示该条新闻属于「学术动态」分类；
- 展示端过滤列表时传 **`category_id = news_category.id`**。

### 3.3 `news-categories.parentId` 与 `menus.id` 的关联（**已定稿：方案 B**）

> 当前项目为了尽快完成功能，采用功能优先方案：**复用 `news_category.parentId` 表示分类所属菜单 id**（不再表示父分类）。

**字段语义（本项目联调约定）**：

```text
news_category.id        ：新闻分类主键
news.categoryId         ：指向 news_category.id，用于新闻筛选
news_category.parentId  ：本项目中复用为所属菜单 id，即 menus.id
menu.id                 ：菜单主键
menu.parentId           ：菜单树父子关系
```

**真实 menu 示例**（`nav_news` 对应 `/news` 页面）：

```json
{
  "id": 11,
  "parentId": null,
  "name": "新闻动态",
  "code": "nav_news",
  "urlType": "page",
  "pageId": 8,
  "sortOrder": 30,
  "status": true
}
```

**期望配置（后端修复后由成员3写入，当前尚未写入）**：

```json
{
  "id": 1,
  "parentId": 11,
  "name": "学会新闻",
  "code": "news_category_xhxw",
  "sortOrder": 1,
  "status": true
}
```

（id=2 通知公告、id=3 学术动态 同样 **parentId=11**。）

**展示端用法（成员4）**：

1. 当前页面通过 `menus` 找到当前菜单 id（如 `/news` → `nav_news` → **menu.id=11**）。
2. `GET /news-categories`。
3. 筛选 **`item.parentId === currentMenu.id`** 的项，作为该页侧栏/Tab。
4. 点击分类 tab 时，请求 **`/news/show-list?category_id=item.id`**（**item.id 为 news_category.id**）。
5. **不使用 menu.id 作为 category_id**。

> **当前状态**：方案 B 已定稿，但后端 schema 尚未修复（`parentId` 自关联外键仍存在），`parentId=11` **尚未写入成功**。后端未修复前，展示端可临时降级为读全部分类（方案 A），但 `category_id` 仍只传 `news_category.id`。

---

## 4. `/menus` 与 `/news-categories` 职责划分

| 接口 | 职责 | 展示端用途 |
|------|------|------------|
| **`GET /menus`** | **站点一级导航 / 页面入口** | 顶栏导航、页面与 `pageId` 的对应；**不**再将其 `id` 当作 `category_id`。 |
| **`GET /news-categories`** | **某个页面下的子分类 Tab** | Type1 / Type3 侧栏或顶 Tab；`id` → `show-list` 的 `category_id`；`parentId` → 归属的 `menu.id`。 |

补充说明：

- **`/menus`**：管「去哪个页面」（node-tree 第一级站点结构 / 顶栏）。
- **`/news-categories`**：管「页面内有哪些子分类、每个分类下有哪些新闻」。

---

## 5. 建议：为 Type2 单篇文章增加独立分类（供成员4 / Type4 扩展）

Type2（`rich_text`）是**整页单篇文章**，与 Type1 列表、Type3 卡片墙不同。

**建议成员3在 `news-categories` 中增加一类「单篇正文 / 静态页」类型**，例如：

| 建议字段 | 说明 |
|----------|------|
| `code` | 如 `single_article`、`about_intro` 等 |
| `parentId` | 绑定对应 `menu.id` / 页面 |
| 与新闻列表区分 | 可不参与 `show-list` 多条的逻辑，或仅关联 1 条固定 `news.id` |

**目的：**

- 成员4 / 后台配置时可**按分类直接查一条文章**，绑定到 Type2 节点；
- 后续若增加 **Type4.vue**（与 Type2 类似的单片文章），可共用该 `news-categories` 类型，避免与 `news_list` 的列表分类混淆。

展示端当前 Type2 仍用组件内占位数据；对接后建议 node-tree 传：

- `dataBindingId` = 目标新闻 `id`，或
- `propsJson` 内直接带文章字段（与成员3约定其一即可）。

---

## 6. 成员3 侧待办清单

- [ ] 删除所有 node-tree 中的 **`conference_page`** 节点；会议相关页改用 Type1/2/3 之一或 `home_events`（仅首页）。
- [ ] 确认 **`news_list` / `rich_text` / `services_page`** 与页面路径映射（308～312 等）。
- [ ] **`news-categories`** 补全 **`parentId → menus.id`**（**已定方案 B**；待后端取消自关联外键后执行，目标：id 1/2/3 均 parentId=**11**）。
- [ ] 保证 **`news.categoryId`** 与 **`news_category.id`** 一致（1/2/3），**禁止**用 `menu.id` 当 `category_id`。
- [ ] （可选）新增单篇文章用 `news-categories` 类型，供 Type2/Type4 绑定。

---

## 7. 展示端验收路径

| 路径 | 期望 componentKey | 期望效果 |
|------|-------------------|----------|
| `/` | 首页各 `home_*` | 首页正常 |
| `/news` | `news_list` (Type1) | 侧栏 3 分类 + 列表有数据 |
| `/about/introduction` | `rich_text` (Type2) | 单篇文章页 |
| `/services` | `services_page` (Type3) | 顶 Tab + 卡片块，无侧栏 |
| `/conference` | **不再使用** `conference_page` | 按新 node-tree 配置验收 |

Network 重点：

- `GET /news-categories` → 200；后端修复后应含 **`parentId=11`**（当前仍为 null，schema 未修复）
- `GET /news/show-list?category_id=1|2|3` → 200，且 `categoryId` 与参数一致
- `GET /page-versions/{id}/node-tree` → 无 `conference_page`、无未知 componentKey

---

*文档版本：展示端 Type1/2/3 重构后*  
*联调仍以 `currentVersionId` 拉 node-tree，不依赖 publish 状态。*
