# page-version 真实接入与接口健康检查报告

> 日期：2026-06-27  
> 范围：仅 `yaai-lowcode` 前端；未改 YAAI / 后端 / SQL。

---

## 1. 本轮目标

将 `src/api/page-version.ts` 中仍走内存 mock / 假成功的版本管理写操作，改为真实 `requestJson` 调用；修正错误 API 路径；持续抽样检查其它核心接口健康状况；**不做污染性写验证**。

---

## 2. 权限边界

| 项 | 结果 |
|---|---|
| 修改 YAAI | 否 |
| 修改后端 | 否 |
| 执行 SQL | 否 |
| 调用写接口（POST/PUT/DELETE） | 否 |
| 影响 308~312 node-tree | 否 |
| 修改 currentVersionId | 否 |

---

## 3. 后端 page-version 契约（只读扫描）

后端控制器：`PageVersionController`，基路径 **`/pages/{pageId}/versions`**（**不是** `/page-versions/{id}`）。

| 功能 | 方法 | 路径 | 请求体/参数 | 返回 | 是否存在 |
|---|---|---|---|---|---|
| 列表 | GET | `/pages/{pageId}/versions?current=&size=` | 无 | `IPage<PageVersion>`（records/total） | 是 |
| 详情 | GET | `/pages/{pageId}/versions/{id}` | 无 | `PageVersion` | 是 |
| 新建版本 | POST | `/pages/{pageId}/versions` | JSON body：`versionName/sourceType/sourceId/remark` 等 | `PageVersion` | 是 |
| 从模板创建 | POST | `/pages/{pageId}/versions/from-template` | form：`templateId, versionName, remark` | `PageVersion` | 是 |
| 删除版本 | DELETE | `/pages/{pageId}/versions/{id}` | 无 | `Long`（被删 id） | 是 |
| 发布版本 | POST | `/pages/{pageId}/versions/{id}/publish` | 无 body | `{ page_version, page }` | 是（历史联调曾 SYSTEM_ERROR） |
| 复制版本 | POST | `/pages/{pageId}/versions/{id}/clone?versionName=` | query 可选 | `PageVersion` | 是（**仅复制元数据，不复制 node-tree**） |
| 锁定版本 | POST | `/pages/{pageId}/versions/{id}/lock` | 无 | `PageVersion` | 是 |
| 解锁版本 | POST | `/pages/{pageId}/versions/{id}/unlock` | 无 | `PageVersion` | 是 |

**独立 node-tree 路由**（`PageNodeController`）仍为 `/page-versions/{versionId}/node-tree`，与版本 CRUD 路径前缀不同。

**历史错误路径（前端曾使用，后端无对应路由）**：

- `GET /page-versions/{id}` → SYSTEM_ERROR
- `GET /page-versions?current=&size=` → SYSTEM_ERROR

---

## 4. 修改的前端文件

| 文件 | 变更 |
|---|---|
| `src/api/page-version.ts` | 全部写操作改真实 API；修正路径；移除 integration 模式 mock/fallback；`getPageVersion` 等补 `pageId` |
| `src/views/page-version/PageVersionListView.vue` | 发布/复制/锁定/删除调用传入 `pageId` |

---

## 5. 移除的 mock / fake success

在 `VITE_USE_REAL_API=true` 下，以下函数**不再**写内存 mock 数据库：

- `createPageVersion`
- `deletePageVersion`
- `publishPageVersion`
- `clonePageVersion`
- `lockPageVersion` / `unlockPageVersion` / `setPageVersionLock`

`success=false` 一律 `throw`，不 fallback mock，不伪造 id/status。

---

## 6. 已改为真实 requestJson 的函数

| 函数 | 真实路径 |
|---|---|
| `listPageVersions` | `GET /pages/{pageId}/versions`（原本已接，保留） |
| `getPageVersion` | `GET /pages/{pageId}/versions/{id}`（**路径修正**） |
| `createPageVersion` | `POST /pages/{pageId}/versions` |
| `createPageVersionFromTemplate` | `POST /pages/{pageId}/versions/from-template`（原本已接，保留） |
| `deletePageVersion` | `DELETE /pages/{pageId}/versions/{id}` |
| `publishPageVersion` | `POST /pages/{pageId}/versions/{id}/publish` |
| `clonePageVersion` | `POST /pages/{pageId}/versions/{id}/clone` |
| `lockPageVersion` | `POST /pages/{pageId}/versions/{id}/lock` |
| `unlockPageVersion` | `POST /pages/{pageId}/versions/{id}/unlock` |

---

## 7. 仍可能被后端阻塞的接口

| 接口 | 阻塞类型 | 说明 |
|---|---|---|
| `GET/POST/DELETE /pages/{pageId}/versions/*` | **TOKEN_INVALID**（无登录态 curl） | 接口存在，需登录后验证业务闭环 |
| `POST .../publish` | **历史 SYSTEM_ERROR** | 文档登记未修复；前端已真实调用，失败会抛错，不假成功 |
| `POST .../clone` | **后端能力缺口** | 后端 `cloneVersion` 仅复制版本元数据，**不复制 page_node** |
| `GET /page-versions/{id}`（旧路径） | **路径错误** | 前端已不再使用 |

---

## 8. 写验证

| 项 | 结果 |
|---|---|
| 是否做写验证 | **否** |
| 原因 | 版本接口 curl 返回 TOKEN_INVALID；且需避免污染 308~312 与 currentVersionId |
| 策略 | 采用策略 C（不做写验证） |

---

## 9. 接口健康检查

### 9.1 修复前（抽样）

| URL | 结果 |
|---|---|
| `GET /page-versions?...` | SYSTEM_ERROR（错误路径） |
| `GET /page-versions/308` | SYSTEM_ERROR（错误路径） |
| `GET /pages/7/versions` | TOKEN_INVALID |
| `GET /page-versions/308/node-tree` | SUCCESS |
| `GET /pages` / `/menus` / `/news` / `/role/queryAll` | SUCCESS |

### 9.2 修复后（抽样）

| URL | 结果 |
|---|---|
| `GET /page-versions?...` | SYSTEM_ERROR（仍为错误路径，预期） |
| `GET /page-versions/308` | SYSTEM_ERROR（仍为错误路径，预期） |
| `GET /pages/7/versions` | TOKEN_INVALID（**正确路径，需登录**） |
| `GET /pages/7/versions/308` | TOKEN_INVALID（**正确路径，需登录**） |
| `GET /page-versions/308/node-tree` | SUCCESS |
| `GET /pages` / `/menus` / `/news` / `/role/queryAll` | SUCCESS |

### 9.3 其它核心接口

读链路（pages/menus/news/role/node-tree）仍正常；component-def/data-binding 等仍受登录态限制（与上轮一致）。

---

## 10. 数据库污染控制

| 项 | 结果 |
|---|---|
| 是否创建数据 | 否 |
| 是否删除数据 | 否 |
| 是否影响 308~312 | 否 |
| 是否影响 currentVersionId | 否 |
| 是否影响 node-tree | 否 |

---

## 11. type-check

```
npm run type-check → 通过（vue-tsc --noEmit）
```

---

## 12. 当前风险

1. **登录态**：版本列表/写操作在无 token 时返回 TOKEN_INVALID，管理端需补登录闭环后才能浏览器实机验收。
2. **publish**：历史 SYSTEM_ERROR 未在本轮复测写接口；前端已真实调用，若仍失败用户会看到明确错误。
3. **clone 不复制节点**：后端 `cloneVersion` 不复制 page_node，复制后编辑器可能是空树（后端能力问题）。
4. **旧文档/脚本**：若仍有 curl 使用 `/page-versions/{id}`，会误判为后端故障。

---

## 13. 下一步建议

**在管理端补登录态后，对 `/pages/10/versions`（会议页，非 308 首页）做一次 clone→delete 最小写闭环验收，并单独记录 publish 是否仍 SYSTEM_ERROR。**

---

## 14. 第二轮：最小化联调测试（2026-06-27）

### 14.1 测试目标

验证修复后的 page-version 真实路径是否可用；在**不污染 308~312 / currentVersionId / node-tree** 前提下，尝试 `pageId=10`、`versionId=311` 的 **clone→delete** 可回收闭环。

### 14.2 登录态确认

| 项 | 结果 |
|---|---|
| curl 直连是否有 token | **否**（未配置 Sa-Token / Authorization） |
| `GET /pages/10/versions` | HTTP 200，`code=TOKEN_INVALID`，`message=请先登录` |
| `GET /pages/10/versions/311` | HTTP 200，`code=TOKEN_INVALID` |
| yaai-lowcode dev（5173/5174） | **未运行**（curl 连接失败） |
| 浏览器 Network 验证 | **未执行**（无 dev server + 无登录会话） |

**结论**：按约束 **停止所有写接口测试**（clone/delete/publish/lock/unlock 均未调用）。

### 14.3 写前只读 GET

| URL | 结果 | 说明 |
|---|---|---|
| `GET /pages?current=1&size=100` | SUCCESS | pageId=**10** 存在，`name=学术会议`，`currentVersionId=**311**` |
| `GET /pages/10/versions?current=1&size=100` | **TOKEN_INVALID** | 无法读取 version 列表/数量 |
| `GET /pages/10/versions/311` | **TOKEN_INVALID** | 无法读取 version 311 详情 |
| `GET /page-versions/311/node-tree` | SUCCESS | version 311 存在，**nodes=2**（4137 根容器 + 4138 rich_text） |

### 14.4 clone → delete 测试

| 项 | 结果 |
|---|---|
| 是否执行 | **否** |
| 原因 | 版本 CRUD 接口需登录态；curl 无 token |
| newVersionId | 无 |
| 残留 versionId | 无 |
| 是否已删除/回滚 | 不适用 |

### 14.5 publish / lock-unlock

| 项 | 结果 |
|---|---|
| publish 实测 | **否**（本轮禁止 + 无登录态） |
| lock/unlock 实测 | **否**（本轮默认不做；且无登录态） |
| 静态确认 | 前端路径已为 `/pages/{pageId}/versions/{id}/publish|lock|unlock`；`page-version.ts` 中**已无** `/page-versions/{id}` 调用 |

### 14.6 前端页面 Network 验证

| 项 | 结果 |
|---|---|
| 是否仍调用旧路径 `/page-versions/{id}` | **代码层否**（静态扫描 `page-version.ts` 无该路径） |
| 是否调用新路径 `/api/pages/{pageId}/versions` | **浏览器未实测**（dev 未启动）；代码层 `listPageVersions` 使用 `/pages/${pageId}/versions` |

### 14.7 测试后健康检查

| URL | 结果 |
|---|---|
| `GET /pages?current=1&size=100` | SUCCESS |
| `GET /menus?current=1&size=100` | SUCCESS |
| `GET /page-versions/311/node-tree` | SUCCESS（nodes=2） |
| `GET /news?current=1&size=1` | SUCCESS |
| `GET /role/queryAll` | SUCCESS |

### 14.8 数据库污染控制

| 项 | 结果 |
|---|---|
| 是否影响 308~312 | 否 |
| 是否影响 currentVersionId | 否（page 10 仍为 311） |
| 是否影响 node-tree | 否 |
| 是否残留测试版本 | 否 |

### 14.9 本轮结论

- **读链路**：pages 列表、node-tree 311、其它核心 GET 正常。
- **版本 CRUD 读/写**：curl 无登录态下返回 TOKEN_INVALID，**clone→delete 闭环未完成**。
- **前端代码**：路径修复已落地；真实可用性需在**登录 + dev 运行**后补测。

### 14.10 下一轮建议

启动 `yaai-lowcode` dev 并完成管理员登录后，在浏览器打开 `/pages/10/versions`，由 Network 确认 `/api/pages/10/versions` 200，再执行一次 **clone→delete**（禁止 publish、禁止动 308~312）。
