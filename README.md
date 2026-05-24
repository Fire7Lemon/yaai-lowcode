# yaai-lowcode-0423

> **新进项目：** 请先读 **[文档总入口 · `README`](docs/00_文档入口/README.md)**，再按需打开下文链接。脚手架与 npm 命令仍在本 README 下半部分。  
>
> **重要约定：** 浏览器/Vite 开发态请求前缀 **`/api/...`**；**curl 直连后端**形如 `http://127.0.0.1:9876/...` 时 **不要**再套一层 **`/api`**（易误报 `SYSTEM_ERROR`）。

**权威分类（当前结构）：**

| 用途 | 路径 |
|------|------|
| **文档总入口** | **[docs/00_文档入口/README.md](docs/00_文档入口/README.md)** |
| **文档索引（全员）** | [docs/00_文档入口/文档索引.md](docs/00_文档入口/文档索引.md) |
| **成员 4 · 前台接入说明** | [docs/02_前台对接/前台接入后台低代码说明.md](docs/02_前台对接/前台接入后台低代码说明.md) |
| **成员 4 · 前台结构映射分析** | [docs/02_前台对接/前台结构映射分析.md](docs/02_前台对接/前台结构映射分析.md) |
| **低代码数据对齐计划** | [docs/02_前台对接/低代码数据对齐计划.md](docs/02_前台对接/低代码数据对齐计划.md) |
| **数据库设计（v6.0）** | [docs/01_设计基线/数据库设计_v6.0_平台型低代码版.md](docs/01_设计基线/数据库设计_v6.0_平台型低代码版.md) |
| **接口契约（v2.0）** | [docs/01_设计基线/前端需求接口文档_v2.0.md](docs/01_设计基线/前端需求接口文档_v2.0.md) |
| **`component_key` 白名单** | [docs/01_设计基线/component_key白名单.md](docs/01_设计基线/component_key白名单.md) |
| **接口字段差异（适配说明）** | [docs/01_设计基线/接口字段差异记录.md](docs/01_设计基线/接口字段差异记录.md) |
| **后端接口修复要求（交付版）** | [docs/04_后端修复/后端接口修复要求_交付版.md](docs/04_后端修复/后端接口修复要求_交付版.md) |
| **数据库清洗计划** | [docs/05_数据库清洗/数据库清洗计划.md](docs/05_数据库清洗/数据库清洗计划.md) |
| **数据库现状只读盘点** | [docs/05_数据库清洗/数据库现状只读盘点.md](docs/05_数据库清洗/数据库现状只读盘点.md) |
| **数据库清洗候选清单** | [docs/05_数据库清洗/数据库清洗候选清单.md](docs/05_数据库清洗/数据库清洗候选清单.md) |
| **数据库清洗 SQL 草案（勿直接执行）** | [docs/05_数据库清洗/数据库清洗SQL_待确认.sql](docs/05_数据库清洗/数据库清洗SQL_待确认.sql) |

- **`docs/archive/`**：**仅历史参考**，**不要**作为当前实现依据；**成员 4 不要直接以 archive 为开发依据**。  
- **`docs/design/`**：**兼容旧入口**的短文/跳转；**当前有效设计基线以 `docs/01_设计基线/` 为准**。

---

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
