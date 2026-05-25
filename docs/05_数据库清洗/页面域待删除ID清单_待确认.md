# 页面域待删除 ID 清单（待确认）

> **状态**：以下为 **待删 ID 草稿**；**未经签字不得执行**。  
> **依据**：[页面域清空前快照.md](./页面域清空前快照.md)、[页面相关数据重置方案_待确认.md](./页面相关数据重置方案_待确认.md)。  
> **说明**：清零后 menus / pages 等 **`id` 会重新分配**，本表仅作用于**本轮旧数据**删除工单。

---

## 1. 删除策略

| 原则 | 内容 |
|------|------|
| **范围** | 清空**页面域**错误配置后，按 **YAAI 前台消费链路**（`menus`→`pages`→`page-versions/*/node-tree`）重建 |
| **`component_def`** | **整体不删**（白名单条目保留）；仅后续补齐缺失 key / 停用测试 key |
| **`data_binding`** | **暂不删**（业务绑定 id **1～3** 快照见「清空前快照」§10）；除非后续单列确认测试 |
| **用户 / 权限 / 系统配置** | **不清空** |
| **YAAI 前台业务内容表** | **不归本清单删除**（新闻 CMS、分类、banner 等在 YAAI/CMS 自有库维护） |
| **法律效力** | 本清单 **≠** 已执行，仅作工单附件 |

---

## 2. 拟删除 menu

| id | name | code | 删除原因 |
|----|------|------|----------|
| 1 | 首页 | menu_home | 页面域清零：**page_id→1** 整条链废止后重建 |
| 2 | 新闻中心 | menu_news | **status=false** 却仍挂子菜单 4、5，结构不可用 |
| 3 | 关于我们 | menu_about | 同上随域清零 |
| 4 | 学会新闻 | menu_xhxw | **`urlType=page` + `externalUrl` query**：与产品设计冲突 |
| 5 | 通知公告 | menu_notice | 同上 |

---

## 3. 拟删除 page

| id | name | code | path | currentVersionId | 删除原因 |
|----|------|------|------|-----------------|----------|
| 1 | 首页 | home | `/` | 101 | published 节点树不合规（快照 §7）；**path 可按新工单再建** |
| 2 | 新闻中心 | news | `/news` | 200 | **草稿当头版** + 双子根 |
| 3 | 关于我们 | about | `/about` | 300 | path 与子路由不匹配 + 冗余轮播占位 |
| 4 | CamelProbe | `pg_1777793968739_fwmcy91f` | `/p-pg_1777793968739_fwmcy91f` | null | 探针页 |
| 5 | 联调测试页面-已更新 | `integration_test_page_1777794000723` | `/integration-test-1777794000723` | null | remark 明示联调可删 |

---

## 4. 拟删除 page_version

| pageId | versionId | versionName | status | 删除原因 |
|--------|-----------|-------------|--------|----------|
| 1 | **101** | 首页正式版 | published | 树不可用，整页删 |
| 1 | 100 | 首页草稿版 | draft | 随首页删 |
| 1 | 304 | from-template-api-test | draft | api-test |
| 1 | 305 | from-template-api-test | draft | api-test |
| 1 | 306 | from-template-api-test | draft | api-test |
| 1 | 307 | it_from_template_0429200817 | draft | integration-test |
| 2 | **200** | 新闻频道草稿版 | draft | draft 当头版 |
| 3 | **300** | 关于我们正式版 | published | `/about` 策略废弃 |
| 3 | 301 | 关于我们草稿版 | draft | 同上 |
| 3 | 302 | 关于我们草稿版 | draft | 同上 |
| 3 | 303 | 关于我们草稿版 | draft | 同上 |

**页面 id=4、5**：`GET /pages/{id}/versions` 为空，本节无条目。

---

## 5. 拟删除 page_node

### 口径

- **若后端**在删除 **`page_version` / `page`** 时对 **`page_node` 级联**：本表作**冒烟核对**，不必逐个列 **`page_node.id`**。
- **若无级联**：按 **versionId** 清空（或由接口清空 **node-tree**），**最终以库表 FK 文档为准**。

### 快照中的 version 与节点数

| versionId（pageId） | nodes 数量 | 风险摘要 |
|---------------------|-----------|----------|
| 101（1） | 16 | 多根并联、**componentKey 全 null** |
| 100（1） | 0 | — |
| 304～307（各 1） | 各 **7** | **componentKey 全 null**，api-test / integration |
| 200（2） | 2 | **双子根**，draft |
| 300（3） | 5 | 冗余轮播占位，不适「静态关于」预期 |
| 301～303（各 3） | 各 **7** | **componentKey 全 null** |

**删除后冒烟**：

```bash
curl.exe --max-time 10 "http://127.0.0.1:9876/page-versions/<versionId>/node-tree"
```

期望 **404** 或 **`nodes: []`**（以后端契约为准）。

---

## 6. 拟删除 page_template

| id | name | code | 删除原因 |
|----|------|------|----------|
| 1 | 门户首页模板 | portal_home_tpl | 模板树 **componentKey 全 null**（快照 §8） |
| 2 | 新闻频道模板 | news_channel_tpl | 同上 |
| 3 | 单页模板 | single_page_tpl | 空节点或无正式基线，随清零重建 |

---

## 7. 拟删除 reusable_fragment

| id | name | code | 删除原因 |
|----|------|------|----------|
| 1 | 通用头部 | common_header | **双根** + **`container`、`nav_menu`（非冻结白名单）** |
| 2 | 通用底部 | common_footer | **双子根**，结构不可用 |
| 3 | 轮播新闻区块 | hero_news_block | node-tree **空**，随清零重建 |

---

## 8. 明确不删除

| 类别 | 说明 |
|------|------|
| **`component_def`** | **不按本清单清零**；保留现存白名单条目，并后续补齐：`home_services`、`home_events`、`home_shortcuts`、`friend_links`。**`test_component_*`**（如 id=12）宜停用或在引用检查后处理 |
| **`data_binding`** | **暂不删**：id **1** / **2** / **3** —— 供新 **`page_node`** 继续使用 **`dataBindingId`** |
| **用户 / 权限 / 系统配置** | 不在页面域工单内 |
| **新闻 / 分类 / banner（CMS/YAAI 正文侧）主数据** | **不因低代码页面域清空而删库** |
| **YAAI 工程** | **禁止修改** |
| **`yaai-lowcode/src`** | 本策略轮次**不触碰** |

---

## 9. 删除执行顺序建议

### 路径 A：后端 API / 后台管理端（推荐）

1. 删除或清空 **fragment node-tree**（若后端支持）→ 删除 **`reusable_fragment`**  
2. 删除或清空 **template node-tree** → 删除 **`page_template`**  
3. **删除页面版本与节点**（若以「删除 page」带子表为最佳实践则优先使用该 API）→ 删除 **`page`**  
4. 删除 **`menu`**  

### 路径 B：仅能做 SQL（须 DBA 评审；**本文档不产生可执行 SQL**）

**概念顺序 —— 以最数据库 FK 为准**：

1. `page_node`
2. `page_version`
3. `menu`（若 FK 不允许先删 **`page`**，则先于 **`page`** 或先 **`page_id`** 脱钩）
4. `page`
5. 模板树 → `page_template`
6. 片段树 → `reusable_fragment`

**共通**：不得先删除 **`component_def` 白名单**；默认不得删 **`data_binding`**。

---

## 10. 人工确认区

- [ ] 确认当前为 **联调 / 测试库**
- [ ] 确认 **页面域旧数据无需保留**（接受菜单/页面/版本/模板/片段全清后重建）
- [ ] 确认可删除 §2 **menu.id**
- [ ] 确认可删除 §3 **page.id**
- [ ] 确认可删除 §4 **page_version**，并接受旧 **`GET …/page-versions/{id}/node-tree`** 失效
- [ ] 确认可删除 §6 **`page_template`**
- [ ] 确认可删除 §7 **`reusable_fragment`**
- [ ] **`component_def` 保留**，并认领 **四条白名单 key** 补齐
- [ ] **`data_binding` 保留**

---

## 重建前置检查清单（删除执行前再打勾）

- [ ] 已存档 **页面域清空前快照**（或 JSON 附件）
- [ ] 已计划在 **`component_def`** 增补：`home_services`、`home_events`、`home_shortcuts`、`friend_links`（**走 UI/`POST`**，不把本工单当作删表）
- [ ] **`GET /data-bindings`** 仍可得 id **1～3**
- [ ] 已与成员 4 对齐 **path**：`/`、`/news`、`/services`、`/conference`、`/about/introduction|charter|regulations|leaders|branches|local`，及 **`component-map` 与白名单**

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-20 | 首版：与清空前快照 GET 对齐 |
