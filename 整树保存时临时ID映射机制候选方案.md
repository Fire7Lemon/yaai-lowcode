# 整树保存时临时 ID 映射机制候选方案

> 目的：为 `page_version` / `page_template` / `reusable_fragment` 的整棵节点树全量覆盖保存接口，补充一版可与后端确认的“新旧节点 ID 映射”候选机制说明。
>
> 约束前提：
>
> - 不新增数据库字段
> - 不新增数据库表
> - 节点树请求体仍严格围绕 `page_node` 既有字段
> - 当前已确认：节点树接口返回平铺数组，整树保存采用全量覆盖保存

---

## 一、问题背景

整树保存时，前端通常会同时提交：

1. 已存在节点
2. 新增但尚未落库的节点
3. 新增节点之间的父子关系

对于已存在节点：

- `id`、`parent_id` 都是后端真实 ID

对于新增节点：

- 需要一种“临时标识”机制，让前端能够在同一次请求中表达：
  - 这个节点是新节点
  - 它的父节点也是新节点
  - 它和其他新节点之间的层级关系如何建立

如果没有映射机制，仅使用 `id = null`：

- 前端无法在同一次请求里准确表达“新节点 A 的父节点是新节点 B”
- 因为 `parent_id` 无法稳定引用尚未落库的新节点

所以整树保存时，必须先明确“新节点在请求中的临时 ID 规则”。

---

## 二、候选方案总览

## 方案 A：新节点使用负数临时 ID

### 表达方式

- 已存在节点：
  - `id > 0`
  - `parent_id > 0` 或 `null`
- 新增节点：
  - `id < 0`
  - `parent_id` 可以引用另一个负数临时 ID

请求示例：

```json
{
  "nodes": [
    {
      "id": 701,
      "page_version_id": 101,
      "template_id": null,
      "fragment_id": null,
      "parent_id": null,
      "node_type": "container",
      "component_key": "page_container",
      "node_name": "页面根容器",
      "slot_name": "main",
      "sort_order": 1,
      "col_span": 1,
      "row_span": 1,
      "data_binding_id": null,
      "ref_fragment_id": null,
      "props_json": "{}",
      "style_json": "{}",
      "layout_json": "{}",
      "event_json": null,
      "visible_rule_json": null,
      "status": true,
      "remark": null
    },
    {
      "id": -1,
      "page_version_id": 101,
      "template_id": null,
      "fragment_id": null,
      "parent_id": 701,
      "node_type": "container",
      "component_key": "hero_split_container",
      "node_name": "新增容器",
      "slot_name": "main",
      "sort_order": 2,
      "col_span": 1,
      "row_span": 1,
      "data_binding_id": null,
      "ref_fragment_id": null,
      "props_json": "{}",
      "style_json": "{}",
      "layout_json": "{}",
      "event_json": null,
      "visible_rule_json": null,
      "status": true,
      "remark": null
    },
    {
      "id": -2,
      "page_version_id": 101,
      "template_id": null,
      "fragment_id": null,
      "parent_id": -1,
      "node_type": "component",
      "component_key": "hero_banner",
      "node_name": "新增轮播",
      "slot_name": "left",
      "sort_order": 1,
      "col_span": 1,
      "row_span": 1,
      "data_binding_id": 601,
      "ref_fragment_id": null,
      "props_json": "{}",
      "style_json": "{}",
      "layout_json": null,
      "event_json": null,
      "visible_rule_json": null,
      "status": true,
      "remark": null
    }
  ]
}
```

### 后端处理逻辑

1. 识别 `id > 0` 的节点为已存在节点
2. 识别 `id < 0` 的节点为本次请求中的新节点
3. 为每个负数临时 ID 生成新的真实 ID
4. 建立临时 ID 到真实 ID 的映射
5. 将所有节点中的 `parent_id` 按映射替换
6. 最终执行全量覆盖保存

### 优点

- 不新增字段
- 不改变核心模型
- 能表达“新节点引用新父节点”
- 实现清晰，前后端都容易理解

### 缺点

- 需要明确约定：负数 ID 仅为请求层临时值，不代表数据库真实值

### 推荐程度

**推荐作为第一候选方案。**

---

## 方案 B：新节点使用 `id = null`

### 表达方式

- 已存在节点：`id > 0`
- 新节点：`id = null`

### 问题

当新节点的父节点也是新节点时：

- `parent_id` 无法稳定引用该新父节点
- 因为父节点自身没有可引用的临时主键

### 结论

该方案只适用于：

- 本次保存中所有新节点都直接挂在已存在节点之下

一旦存在“新节点挂新节点”的情况，就表达不完整。

### 推荐程度

**不推荐作为正式方案。**

---

## 方案 C：新节点使用字符串临时 ID

### 表达方式

- 已存在节点：`id` 为数字
- 新节点：`id` 为如 `"tmp_1"`、`"tmp_2"` 之类字符串
- `parent_id` 同样允许传字符串临时值

### 优点

- 表意直观
- 映射关系容易识别

### 问题

- `id` / `parent_id` 在数据库语义上是 `bigint`
- 虽然这是请求层临时值，不进入数据库，但接口类型会出现数字/字符串混用
- 前后端类型约束会更复杂

### 推荐程度

**可行，但不如负数临时 ID 方案简洁。**

---

## 三、建议采用的正式方向

当前建议后续与后端优先确认：

### 建议方案

**采用方案 A：新节点在整树保存请求中使用负数临时 ID。**

### 原因

1. 不新增字段，仍完全围绕 `page_node` 原有字段
2. 可以完整表达新增节点之间的父子关系
3. 前后端实现简单，最适合第一版
4. 不会引入额外并行模型

---

## 四、配套响应建议

如果后端采用负数临时 ID 方案，整树保存成功后，建议响应中返回最终保存结果：

```json
{
  "nodes": [
    {
      "id": 9001,
      "page_version_id": 101,
      "template_id": null,
      "fragment_id": null,
      "parent_id": 701,
      "node_type": "container",
      "component_key": "hero_split_container",
      "node_name": "新增容器",
      "slot_name": "main",
      "sort_order": 2,
      "depth": 1,
      "col_span": 1,
      "row_span": 1,
      "data_binding_id": null,
      "ref_fragment_id": null,
      "props_json": "{}",
      "style_json": "{}",
      "layout_json": "{}",
      "event_json": null,
      "visible_rule_json": null,
      "status": true,
      "remark": null,
      "created_at": "2026-04-23 10:00:00",
      "updated_at": "2026-04-23 10:00:00"
    }
  ]
}
```

前端据此直接替换本地节点列表即可，不强依赖单独的映射表返回。

---

## 五、当前 API 层 TODO 对应关系

当前 `src/api` 中关于整树保存接口仍保留了 TODO，原因就是以下问题尚未最终拍板：

1. 是否正式采用“负数临时 ID”
2. 整树保存时后端是否接受 `id = null`
3. 保存响应是否只返回最终 `nodes`
4. 是否需要额外返回临时 ID 到真实 ID 的显式映射表

在这些点与后端确认之前，前端 mock API 先采用最小可运行对齐，但不把临时 ID 机制写死为最终标准。
