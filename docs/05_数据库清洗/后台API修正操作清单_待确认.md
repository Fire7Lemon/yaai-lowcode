# 后台 API 修正操作清单（待确认）

> **本文件不包含已执行记录**；每项实施前须经负责人签字与环境确认。

---

## 1. 执行前置条件

| # | 条件 |
|---|------|
| 1 | **已确认当前连接的是联调库**，不是生产库（连接串 / 数据源 / 控制台环境名双人核对）。 |
| 2 | **已备份数据库**（逻辑导出或快照）；回滚路径已写在变更单上。 |
| 3 | **已冻结后台编辑器写入**（或约定变更窗口：无运营同时发布）；避免半截树与并发覆盖。 |
| 4 | **已确认 component_key 白名单**：[component_key白名单.md](../01_设计基线/component_key白名单.md)。 |
| 5 | **已确认成员 4 前台**将按同一白名单实现 **`component-map.ts`**（未知键走 **UnknownComponent**，不崩溃）。 |
| 6 | **本文为待确认清单** —— 可复制为工单执行，但不代表任何人已替你执行写入。 |

**工具分工（建议）**

| 目标 | **优先** | **备选** | **不建议** |
|------|----------|----------|-------------|
| 补组件定义字段 / 停用 | **后台组件定义 UI** | `POST`/`PATCH` component-def API（若在环境中稳定） | 裸 **`INSERT`** 未审计 JSON |
| 发布版本 / currentVersionId | **发布流水线或页面版本 UI** | 发布专用 API | 手写 **`UPDATE page SET current_version_id=…`** |
| 菜单调整 | **菜单管理 UI** | menu CRUD API | 大批量 SQL |
| 首页节点树重建 | **低代码编辑器**（分步建节点 → 拖拽槽位 → 绑定）或 **分段 API** | 文档评审后的 **`PUT .../node-tree`**（见风险提示） | 直接 **`DELETE`/批量 SQL** 清空树 |

---

## 2. `component_def` 修正

### A. 必须存在且 `status=true` 的正式 key（冻结白名单）

- `page_container`
- `hero_banner`
- `notice_list`
- `quick_links`
- `home_services`
- `home_events`
- `news_list`
- `home_shortcuts`
- `friend_links`
- `rich_text`

### B. 若缺失

- **建议**：通过 **后台「组件定义」页面**逐项新建；或使用 **`POST /component-defs`**（请求体 **`prop_schema_json` / `default_props_json` 等仍为字符串字段**，与后端契约一致）。
- **验证**：`GET /component-defs` → 分页拼全后与上表逐项对照。

### C. `test_component_1777798334444`

1. **`GET`** 或通过 SQL **只读**（若允许离线分析）列出 **`page_node.component_key`** 是否引用该 key。亦可搜索 **node-tree GET** 导出中的 `componentKey`。  
2. **无引用** → 建议 **`status=false`** 或删除 **`DELETE /component-defs/{id}`**。  
3. **若 DELETE 后端异常** → **先停用**(`status=false`)，记入后端缺陷队列。  
4. **验证**：再次 `GET /component-defs`；必要时 `GET` 受影响版本的 **node-tree**。

### D. 白名单外可能仍被引用的 key

包括但不限于：`container`、`hero_split_container`、`grid_container`、`nav_menu`、`copyright`。

- **建议**：先 **保留** 或以 **`status=false`** 下线 **新建时的可选性**，**勿直接物理删除**，除非引用检查清零且双人签字。

---

## 3. `page` / `page_version` 修正（对齐真库盘点）

### 首页 `page.id=1`，`path=/`

- **现状**：`currentVersionId → 101`；**101 为 published** ✓  
- **问题**：node-tree **101** 不可用（componentKey null、多根） —— **需重建树**而非仅改表层字段  
- **建议通道**：编辑器或受控 **`PUT /page-versions/101/node-tree`**（见 **[首页节点树重建方案_待确认.md](./首页节点树重建方案_待确认.md)**）  
- **验证**：`GET /pages`、`GET /pages/1/versions`、`GET /page-versions/101/node-tree`

### 新闻 `page.id=2`，`/news`

- **现状**：**`currentVersionId=200` 对应 version，`status=draft`**  
- **建议**：使用 **发布接口** 将 200 **发布为 published**，或 **新建副本发布**后将 **`page.currentVersionId`** 指向 **published**。  
- **原则**：前台若只消费 **published**，**不得**把头版指向 **draft**。  
- **验证**：`GET /pages/2`、`GET /pages/2/versions`、`GET /page-versions/200/node-tree`

### 关于 `page.id=3`，`/about`

- **现状**：current→**300**，**published**  
- **与 YAAI**：`/about` 与 **`/about/introduction`** 等多子路由可能不一致  
- **建议**：产品与成员 4 二选一：**(a)** 占位 **`/about` 跳转**首个子路由；**(b)** 将 **`page.path`** 调整为 **`/about/introduction`** 并理顺菜单指向。  
- **验证**：`GET /pages`、`GET /menus`、`GET /page-versions/300/node-tree`

### 探针/联调 `page.id=4`、`5`

- **列为删除候选**：删除前 **必须**引用检查：**menu.page_id**、孤立 **page_version/page_node**。  
- **验证**：候选清单 **[清洗前数据快照 §1](./清洗前数据快照.md)**；执行后 **`GET /pages`**、**`GET /menus`**

---

## 4. `menu` 修正

| 主题 | 建议 |
|------|------|
| 首页菜单 | **`url_type=page`**，**`page_id=1`**（与 **`path=/`** 一致） |
| 新闻动态 | 指向 **`page_id=2`** 或产品与前台约定的「新闻着陆页」（path **`/news`**） |
| 关于 | 对齐 **`page.id=3`** 或通过 **占位 path**；若仅作父菜单，可无叶子 URL（依后台契约） |
| **菜单 4 / 5** | 当前 **`urlType=page`** 同时 **`externalUrl=/news?category=…`**：**修正或删除**。新闻分类条目 **优先由成员 4 新闻分类 API** 渲染，**不建议长期混写进 menu 的 externalUrl**。 |
| 父 **`menu.id=2` `status=false`** 带子 **4 / 5** | **启用父菜单**或 **迁移子菜单 parent** 至可见父级 |

**验证**：`GET /menus`；若要核对落地 path，再配合 **`GET /pages/{id}`**（若单行接口可用）或快照中的 pages 列表。

---

## 5. 首页 node-tree（version **101**）重建方案要点

当前 **101**：约 **16** 节点、**componentKey 全 null**、**四根并联** —— **不适配 YAAI**。

### 建议目标拓扑（自上而下 · 单根）

```
page_container（根，slot_name=main）
  ├── hero_banner
  ├── notice_list
  ├── quick_links
  ├── home_services
  ├── home_events
  ├── news_list
  ├── home_shortcuts
  └── friend_links
```

> **排版说明**：是否在 `notice_list`/`quick_links` 外仍保留 **两列容器**（如 `hero_split_container`），由产品与前台网格决定。**正式业务键仅以白名单为准**；不推荐新页再引入 **`hero_split_container`**。

### 各节点建议 `propsJson`（API 中为 **camelCase** 外层字段；下层 JSON **字符串序列化**，与后端一致）

**`hero_banner`**（示例）

```json
{
  "title": "云南大学人工智能学会",
  "subtitle": "聚焦人工智能学习、科研与实践",
  "autoplay": true
}
```

**`notice_list`**

```json
{
  "title": "通知公告",
  "limit": 5,
  "showDate": true
}
```

**`quick_links`**

```json
{
  "title": "快捷入口",
  "items": []
}
```

**`home_services`**

```json
{
  "title": "服务矩阵",
  "subtitle": "提供人工智能学习、科研与实践服务",
  "columns": 4,
  "items": []
}
```

**`home_events`**

```json
{
  "title": "活动预告",
  "limit": 4,
  "showDate": true
}
```

**`news_list`**

```json
{
  "title": "新闻动态",
  "limit": 6,
  "showDate": true
}
```

**`home_shortcuts`**

```json
{
  "title": "快捷导航",
  "items": []
}
```

**`friend_links`**

```json
{
  "title": "友情链接",
  "items": []
}
```

完整落地步骤、**整树 PUT 风险**、**临时 id** 与 **不生成可执行 JSON** 的说明见：[首页节点树重建方案_待确认.md](./首页节点树重建方案_待确认.md)。

---

## 6. 推荐执行顺序

1. **备份数据库**  
2. **确认联调库**  
3. **补 `component_def`**（白名单缺口 + 停用测试 key）  
4. **修 `page_version` / `page.currentVersionId`**（尤其 **新闻 draft 当头版**）  
5. **修 `menu`**（父子、url 语义、page 指向）  
6. **重建首页 node-tree（101）**  
7. **删除或停用测试 page / version / 节点**（引用检查在前）  
8. **GET 全量验证**（§7）  
9. **成员 4 前台联调**

---

## 7. 每步验证接口（一律 `curl --max-time 10`，无 `/api`）

| 步骤后 | 建议 GET |
|--------|----------|
| 任意写 component_def 后 | `/component-defs`（分页拉全） |
| 任意写 page / version / current 后 | `/pages`、`/pages/{id}/versions` |
| 任意写 menu 后 | `/menus` |
| 首页树变更后 | `/page-versions/101/node-tree` |
| 新闻树变更或发版后 | `/page-versions/200/node-tree` |
| 关于页变更后 | `/page-versions/300/node-tree` |

**冒烟组合（最小）**：`/pages` → `/menus` → `/component-defs` → `/page-versions/101/node-tree`。

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-20 | 首版：与清洗前快照、候选清单同源；强调 UI/API/SQL 分工与验证 GET |
