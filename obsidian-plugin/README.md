# Inkbase — Obsidian 本地语义搜索插件

基于 embedding 向量的语义搜索插件。在 Obsidian 内直接对笔记进行智能检索，所有数据存储在本地。

## 功能

- **语义搜索** — 用自然语言描述你想找的内容，而不是精确关键词匹配
- **写点子** — 快速记录灵感，自动索引并推荐相关素材
- **库筛选** — 按文件夹划分"库"，搜索时可选择只搜某个库
- **自动索引** — 文件保存时自动更新向量索引，无需手动操作
- **多 Provider 支持** — 可切换 Pie Gateway / OpenAI / Ollama / 自定义服务

## 安装

1. 下载 `main.js`、`manifest.json`、`styles.css` 三个文件
2. 在 Vault 目录下创建 `.obsidian/plugins/inkbase/` 文件夹
3. 将三个文件放入该文件夹
4. 重启 Obsidian → 设置 → 第三方插件 → 启用 Inkbase

## 使用方式

| 操作 | 入口 |
|------|------|
| 语义搜索 | 侧边栏 🔍 图标 / `Cmd+P` → "Inkbase: 打开语义搜索" |
| 写点子 | 侧边栏 💡 图标 / `Cmd+P` → "Inkbase: 写点子" |
| 重建全部索引 | `Cmd+P` → "Inkbase: 重建全部索引" |
| 插件设置 | 设置 → 第三方插件 → Inkbase 旁的 ⚙️ 齿轮图标 |

---

## 设置说明

进入方式：设置 ⚙️ → 第三方插件区域 → Inkbase 右侧齿轮图标

### 1. Embedding 服务

选择用于生成文本向量的服务。下拉菜单有 4 个选项：

#### Pie Gateway（默认）

通过 PieBox 提供的 AI 网关生成向量。文本只在计算时传输，不存储在云端。

| 字段 | 说明 | 示例 |
|------|------|------|
| App ID | PieBox 应用 ID | `app_63c17985b43acd6d...` |
| App Secret | PieBox 应用密钥 | `sk_live_0912fbe6...` |
| Gateway URL | 网关地址，一般不用改 | `https://pie-gateway.weapp.me` |

> 获取方式：PieBox 项目的 `.piebox/env` 文件中有 `PIE_APP_ID` 和 `PIE_APP_SECRET`。

#### OpenAI 兼容

支持 OpenAI 官方或任何兼容 OpenAI embedding API 格式的服务（如 Azure OpenAI、DeepSeek 等）。

| 字段 | 说明 | 示例 |
|------|------|------|
| API Key | 你的 API 密钥 | `sk-xxxx...` |
| Base URL | API 地址（不含 `/v1/embeddings`） | `https://api.openai.com` |
| 模型 | embedding 模型名 | `text-embedding-3-small` |

#### Ollama（本地）

完全离线，使用本地运行的 Ollama 服务生成向量。需要先安装 Ollama 并拉取模型。

| 字段 | 说明 | 示例 |
|------|------|------|
| Ollama 地址 | Ollama 服务地址 | `http://localhost:11434` |
| 模型名称 | 已拉取的 embedding 模型 | `nomic-embed-text` |

> 安装：`brew install ollama && ollama pull nomic-embed-text`

#### 自定义 Endpoint

用于接入其他任何 OpenAI 格式兼容的 embedding 服务。

| 字段 | 说明 |
|------|------|
| Endpoint URL | 完整的 API 地址 |
| API Key | 认证密钥 |
| 模型 | 模型名称 |

---

### 2. 通用设置

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 点子文件夹 | "写点子"功能保存 .md 文件的目录，相对 vault 根目录 | `ideas` |
| 自动索引 | 开启后，文件每次保存都会自动更新该文件的向量索引 | 开启 |
| 排除文件夹 | 不参与索引的文件夹，用英文逗号分隔多个 | 空 |

**排除文件夹示例**：`templates, .trash, archive`

---

### 3. 库配置

配置搜索时可筛选的"库"。索引仍覆盖整个 vault（除排除文件夹外），库筛选只影响搜索结果的展示范围。

**添加方式**：

1. 在"库名称"输入框填入显示名（如 `素材库`）
2. 在"文件夹路径"输入框填入对应的 vault 内文件夹路径（如 `素材`）
3. 点击"添加"

**使用效果**：搜索侧边栏顶部会出现筛选按钮 `全部 | 素材库 | 点子库`，点击切换搜索范围。

**删除**：每个已添加的库旁边有"删除"按钮。

**路径规则**：
- 路径相对于 vault 根目录
- 不需要开头的 `/`
- 支持嵌套路径，如 `工作/项目笔记`
- 该路径下所有子文件夹的 .md 文件都会被包含

---

### 4. 索引管理

| 项目 | 说明 |
|------|------|
| 当前索引 | 显示已索引的文档数和片段数 |
| 重建索引 | 点击后重新扫描所有文件并生成向量（首次使用或大量修改后使用） |

> ⚠️ 重建索引会对所有文件重新调用 embedding API，文件较多时耗时较长且消耗 API 额度。

---

## 数据存储

| 数据 | 位置 |
|------|------|
| 向量索引 | `.obsidian/plugins/inkbase/inkbase-index.json` |
| 插件设置 | `.obsidian/plugins/inkbase/data.json` |
| 点子文件 | `{点子文件夹}/` 下的 .md 文件 |

所有数据存在 vault 本地目录内，不上传到任何服务器。

## 常见问题

**Q: 首次使用需要做什么？**

1. 启用插件
2. 配置 Embedding 服务（填入密钥）
3. `Cmd+P` → "Inkbase: 重建全部索引"
4. 等待索引完成后即可搜索

**Q: 搜索结果不准确？**

- 确保文件已被索引（检查索引管理中的文档数）
- 尝试用更自然的语言描述，而非关键词
- 索引可能未包含最新修改，尝试重建索引

**Q: 索引文件太大怎么办？**

向量索引大小约为每 100 篇文档占用 8MB。如果 vault 很大，可以用"排除文件夹"排除不需要搜索的目录（如 templates、archive）。

**Q: 切换 Provider 后需要重建索引吗？**

需要。不同模型生成的向量维度和空间不同，切换后必须重建索引。
