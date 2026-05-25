-- =============================================================================
-- 数据库清洗 SQL 草案（待确认）
-- =============================================================================
-- 【禁止直接执行】本文件仅为评审与人工确认用草案，执行前必须：
--   1）全库备份；2）在测试库验证；3）经负责人签字；4）生产变更窗口执行。
-- 【本轮文档】已对 http://127.0.0.1:9876 做 **只读 GET 盘点**，附「附录・观测」；**仍未执行**本文件任一语句。
-- 【表名与字段】以 docs/01_设计基线/数据库设计_v6.0_平台型低代码版.md 中 DDL 为准：
--   page, page_version, page_node, menu, component_def, data_binding,
--   page_template, reusable_fragment
--   若实际库与文档不一致，将下方 SQL 中的标识符替换为真实对象，勿臆造。
-- 【禁止】在本文件中使用任何模拟「整树 PUT」或会破坏 node 结构的非 API 写入；
--   大规模 node-tree 变更优先走后台管理端接口（camelCase 约定见接口字段差异记录）。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. 使用前说明
-- -----------------------------------------------------------------------------
-- 目的：支撑「联调测试数据 → 可给 YAAI 消费的配置数据」清洗。
-- 原则：先 SELECT 锁定行，再 UPDATE，最后才考虑 DELETE；DELETE 默认全部注释。
-- camelCase：HTTP API 与 JDBC/MyBatis 实体可能用驼峰；下表为 **库表物理列名（snake_case）**。
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 1. 备份建议
-- -----------------------------------------------------------------------------
-- mysqldump 全库或至少备份以下表（示例，路径与库名按环境替换）：
-- mysqldump -u... -p... naai_db page page_version page_node menu component_def data_binding page_template reusable_fragment > backup_lowcode_YYYYMMDD.sql
-- 回滚：从备份文件 source 恢复对应表或整库。

-- -----------------------------------------------------------------------------
-- 2. 只读检查 SQL（建议优先执行）
-- -----------------------------------------------------------------------------

-- 2.1 页面与当前版本是否一致
-- SELECT id, name, code, path, status, current_version_id FROM page;

-- 2.2 每个 page 的版本状态
-- SELECT pv.id, pv.page_id, pv.version_no, pv.status, pv.version_name
-- FROM page_version pv
-- ORDER BY pv.page_id, pv.version_no;

-- 2.3 指向不存在页面的菜单（page 类型）
-- SELECT m.id, m.code, m.name, m.page_id
-- FROM menu m
-- LEFT JOIN page p ON m.page_id = p.id
-- WHERE m.url_type = 'page' AND m.page_id IS NOT NULL AND p.id IS NULL;

-- 2.4 当前发布版本 id 是否在版本表中且为 published（示例：需按业务改条件）
-- SELECT p.id AS page_id, p.path, p.current_version_id, pv.status
-- FROM page p
-- LEFT JOIN page_version pv ON p.current_version_id = pv.id
-- WHERE p.current_version_id IS NOT NULL
--   AND (pv.id IS NULL OR pv.status <> 'published');

-- -----------------------------------------------------------------------------
-- 3. 测试数据候选查询（关键字 — 仅列出，不删除）
-- -----------------------------------------------------------------------------

-- 3.1 page / menu / component_def / data_binding 中含测试关键词（按需扩充 LIKE）
-- SELECT id, code, name, remark FROM page
-- WHERE code LIKE '%test%' OR name LIKE '%联调%' OR remark LIKE '%test%';

-- SELECT id, code, name, remark FROM menu
-- WHERE code LIKE '%test%' OR code LIKE '%menu_test%' OR name LIKE '%联调%';

-- SELECT id, component_key, component_name, remark FROM component_def
-- WHERE component_key LIKE '%test%' OR remark LIKE '%test%';

-- SELECT id, name, source_key, remark FROM data_binding
-- WHERE name LIKE '%test%' OR source_key LIKE '%test%' OR remark LIKE '%test%';

-- 3.2 外链占位
-- SELECT id, code, name, external_url FROM menu
-- WHERE external_url LIKE '%example.com%' OR external_url LIKE '%dummyimage%';

-- -----------------------------------------------------------------------------
-- 4. 引用关系检查（删除前必查）
-- -----------------------------------------------------------------------------

-- 4.1 component_def 是否仍被 page_node 引用（按 component_key 外键或字符串匹配）
-- 文档 DDL：page_node.component_key 可关联 component_def.component_key
-- SELECT cd.component_key, COUNT(pn.id) AS node_cnt
-- FROM component_def cd
-- LEFT JOIN page_node pn ON pn.component_key = cd.component_key
-- GROUP BY cd.component_key;

-- 4.2 page 是否仍被 menu 引用
-- SELECT p.id, p.path, COUNT(m.id) AS menu_cnt
-- FROM page p
-- LEFT JOIN menu m ON m.page_id = p.id
-- GROUP BY p.id, p.path
-- HAVING menu_cnt > 0;

-- 4.3 page 的版本与节点数量
-- SELECT p.id AS page_id, p.path, COUNT(DISTINCT pv.id) AS ver_cnt
-- FROM page p
-- LEFT JOIN page_version pv ON pv.page_id = p.id
-- GROUP BY p.id, p.path;

-- SELECT pv.id AS version_id, COUNT(pn.id) AS node_cnt
-- FROM page_version pv
-- LEFT JOIN page_node pn ON pn.page_version_id = pv.id
-- GROUP BY pv.id;

-- -----------------------------------------------------------------------------
-- 5. 建议新增 / 修正 component_def（示例 UPDATE，确认后取消注释并逐条执行）
-- -----------------------------------------------------------------------------
-- 将历史别名改为白名单正式 key（仅当无其他节点仍依赖旧键或已一并更新 page_node）
-- UPDATE component_def SET component_key = 'home_services', remark = CONCAT(IFNULL(remark,''), ' | migrated from service_matrix')
-- WHERE component_key = 'service_matrix';
-- TODO：若 UNIQUE(component_key) 冲突，改用「新建白名单行 + 迁移节点 + 停用旧行」。

-- UPDATE component_def SET component_key = 'home_events', remark = CONCAT(IFNULL(remark,''), ' | migrated from event_list')
-- WHERE component_key = 'event_list';

-- 缺失的白名单组件：优先通过 **后台「组件定义」界面** 新建；若必须 SQL INSERT，请补齐
-- prop_schema_json / default_props_json 等字段，并与 docs/01_设计基线/component_key白名单.md 一致。
-- INSERT INTO component_def (component_key, component_name, is_container, can_bind_data, status)
-- VALUES ('friend_links', '友情链接', FALSE, TRUE, TRUE);  -- 列清单以实际表结构为准，勿直接复制执行

-- -----------------------------------------------------------------------------
-- 6. 建议新增 / 修正 page（示例，待确认 path 与 YAAI 路由一致）
-- -----------------------------------------------------------------------------

-- UPDATE page SET path = '/services', remark = 'align YAAI' WHERE code = '...';

-- -----------------------------------------------------------------------------
-- 7. 建议新增 / 修正 menu（示例）
-- -----------------------------------------------------------------------------

-- UPDATE menu SET page_id = NULL, url_type = 'external', external_url = 'https://...' WHERE id = ...;

-- -----------------------------------------------------------------------------
-- 8. 首页 node-tree（伪代码 / 待 API 执行说明）
-- -----------------------------------------------------------------------------
-- **不建议**用裸 SQL 拼接 JSON 树；推荐顺序：
-- 1）在低代码后台为首页 page 创建/发布 page_version；
-- 2）用编辑器按顺序挂子节点：page_container → hero_banner, notice_list, ...（见 component_key 白名单）；
-- 3）使用 POST/PUT/move 及 PUT .../node-tree（camelCase）保存；
-- 若必须 SQL：仅插入占位节点，且 props_json 形态须与线上一致（JSON 类型列注意转义）。
-- TODO：插入语句依赖真实 page_version.id，须在页面上先创建版本后回填。

-- -----------------------------------------------------------------------------
-- 9. 候选删除 SQL（【全部注释】—— 禁止未经评审取消注释批量执行）
-- -----------------------------------------------------------------------------

-- DELETE FROM page_node WHERE id IN (...);  -- 须先确认无生产依赖、已从 menu 解绑

-- DELETE FROM page_version WHERE id IN (...);  -- 须先调整 page.current_version_id

-- DELETE FROM page WHERE id IN (...);  -- 须先：menu 无引用、版本已处理

-- DELETE FROM data_binding WHERE id IN (...);  -- 须先：page_node.data_binding_id 无引用

-- DELETE FROM component_def WHERE component_key IN (...);  -- **禁止**在有 page_node 引用时删除

-- DELETE FROM menu WHERE id IN (...);

-- -----------------------------------------------------------------------------
-- 10. 回滚建议
-- -----------------------------------------------------------------------------
-- 1）从 mysqldump 恢复相关表。
-- 2）对已执行的 UPDATE：若执行前已 SELECT 出旧值，保存「旧值片段」用于逆向 UPDATE。
-- 3）发布后发现问题：将 page.current_version_id 指回上一已知良好 version_id（须在 page_version 仍存在时）。
-- =============================================================================
--
-- -----------------------------------------------------------------------------
-- 【附录 · 2026-05-20 只读 API 观测】仅作文档交叉引用；表名仍为 snake_case 猜测，以实际库为准
-- -----------------------------------------------------------------------------
-- page.id=1 path=/ currentVersionId=101 (published)
-- page.id=2 path=/news currentVersionId=200 **但 pv200.status=draft** → 需在库或发布流程纠正
-- page.id=3 path=/about currentVersionId=300 (published)，path 建议对齐 YAAI /about/introduction
-- page.id=4,5：探针/联调用，deleted 前先查 menu 引用
--
-- menu.id=4,5：url_type=page 却填 external_url=/news?category=...
--
-- component_def.test：id=12 component_key=test_component_1777798334444；缺白名单键 home_services/home_events/home_shortcuts/friend_links
--
-- node-tree **101**：16 节点，全员 component_key **NULL**，根 id 并联：1101,4012,4015,4018
-- node-tree **200**：双根 1024+4118（均 parent_id null）；version **draft**
-- node-tree **300**：5 节点，component_key 有 page_container/hero_banner
--
-- （以下 ID 若要用于 DELETE / UPDATE，须先执行 §4 引用检查 SQL 并经人工签字）
-- =============================================================================
--
-- -----------------------------------------------------------------------------
-- 【附录 · 2026-05-20 文档侧】清洗前数据快照.md 落盘时 curl 127.0.0.1:9876 未监听（exit 7），
-- 以上观测来自历史连通盘点；执行 SQL 前请以「附录 A」curl 重拉 JSON 为准。
-- -----------------------------------------------------------------------------
--
-- -----------------------------------------------------------------------------
-- 11. 补充只读查询草案（全部保持注释 · 引用检查加深）
-- -----------------------------------------------------------------------------

-- 11.1 首页指定版本下 component_key 为空的节点计数（核对 YAAI 可用性）
-- SELECT COUNT(*) AS null_key_cnt
-- FROM page_node
-- WHERE page_version_id = 101 AND component_key IS NULL;

-- 11.2 首页指定版本多根计数（parent_id IS NULL）
-- SELECT id, node_name, node_type, component_key, sort_order
-- FROM page_node
-- WHERE page_version_id = 101 AND parent_id IS NULL;

-- 11.3 停用父菜单名下的子菜单（业务核对）
-- SELECT c.id AS child_id, c.code AS child_code, c.status AS child_status,
--        p.id AS parent_id, p.code AS parent_code, p.status AS parent_status
-- FROM menu c
-- JOIN menu p ON c.parent_id = p.id
-- WHERE p.status = FALSE OR p.status = 0;

-- 11.4 仍为 page 外链混写（站内 URL 填在 external）
-- SELECT id, code, url_type, page_id, external_url
-- FROM menu
-- WHERE url_type = 'page' AND external_url IS NOT NULL AND TRIM(external_url) <> '';

-- 11.5 测试 component_key 是否在节点表出现（删/停前必跑）
-- SELECT pn.id, pn.page_version_id, pn.component_key, pn.node_name
-- FROM page_node pn
-- WHERE pn.component_key = 'test_component_1777798334444';

-- 11.6 草稿版本被选为页面当前版本（与 API 观测一致时再逐页修）
-- SELECT p.id AS page_id, p.path, p.current_version_id, pv.status AS pv_status
-- FROM page p
-- JOIN page_version pv ON pv.id = p.current_version_id
-- WHERE pv.status <> 'published';

-- 【再次强调】本节 11.* 仅限 SELECT；任何 DELETE / UPDATE / INSERT 必须备份、双人复核后单行展开执行。
