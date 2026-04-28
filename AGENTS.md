# AGENTS.md

## 最高优先级原则

本项目是一个从 0 开始的新后台前端项目。

本项目的一切前端实现，必须严格以根目录中的《数据库设计_v6.0_平台型低代码版.md》为唯一数据模型标准。

任何时候都不允许：

- 擅自新增数据库表
- 擅自新增数据库字段
- 擅自修改字段名
- 擅自修改表关系
- 擅自扩展枚举值
- 擅自发明与数据库设计不一致的页面结构模型
- 擅自发明与数据库设计不一致的组件模型
- 擅自发明与数据库设计不一致的数据绑定模型

## 当前项目的唯一核心模型

后台前端必须围绕以下模型展开：

- page
- page_version
- page_template
- reusable_fragment
- component_def
- data_binding
- page_node
- menu

其中最核心的是：

- 页面结构核心：page_node
- 页面版本核心：page_version
- 组件注册核心：component_def
- 数据绑定核心：data_binding

## 页面结构硬性要求

本项目页面结构的唯一核心主线是：

page -> page_version -> page_node

不允许自行设计任何与此并行的第二套页面结构模型。

不允许把页面编辑器建立在“固定层级页面结构”之上。
所有页面树、预览区、节点操作、插槽、容器、排序、属性编辑，都必须围绕 `page_node` 实现。

## 组件系统硬性要求

组件不是随意写死的前端块，而必须由 `component_def` 驱动。

必须围绕以下字段理解和实现组件系统：

- component_key
- component_name
- component_group
- component_type
- is_container
- can_bind_data
- can_reuse_as_fragment
- prop_schema_json
- style_schema_json
- event_schema_json
- layout_schema_json
- allowed_child_types_json
- default_props_json
- default_style_json

## 数据绑定硬性要求

所有列表类、轮播类、配置类组件的数据来源，必须围绕 `data_binding` 组织：

- binding_type
- source_key
- query_json
- field_map_json
- transform_json
- empty_state_json
- error_state_json
- cache_policy

不允许另外设计一套脱离 `data_binding` 的数据源结构。

## 类型与字段要求

1. 所有 TypeScript 类型必须来源于数据库字段
2. 所有页面表单、表格列、树节点字段必须与数据库一致
3. 所有 mock 数据不得出现数据库中不存在的字段
4. 所有新增代码都要先检查是否符合数据库设计

## 信息不足时的处理方式

如果某个地方信息不足：

- 优先查阅根目录文档
- 采用最小合理实现
- 用 TODO 或 placeholder 保留扩展位
- 不得自行改数据库
- 不得自行新增字段
- 不得自行猜测新的核心数据模型

## 当前任务边界

当前仅建设“后台前端”，重点包括：

- 页面管理
- 页面版本管理
- 页面模板管理
- 可复用片段管理
- 组件定义管理
- 数据绑定管理
- 页面节点树编辑器
- 页面预览区
- 属性面板
- 菜单管理

不主动扩展到与当前任务无关的外围系统。

## 最终目标

做出一个严格贴合 v6.0 数据库设计的平台型低代码后台前端，而不是做一个脱离数据库的自由发挥 demo。