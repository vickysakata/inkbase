# Inkbase

个人知识库工具 — 本地存储，AI 语义搜索。

文档和向量数据全部存储在本地 PostgreSQL，embedding 计算通过 Pie Gateway 完成（仅传输不存储）。

## 本地部署

### 前置要求

- Node.js 18+
- PostgreSQL 14+（本地运行）

### 1. 安装 PostgreSQL（macOS）

```bash
brew install postgresql@16
brew services start postgresql@16
createdb inkbase
```

### 2. 克隆项目

```bash
git clone https://github.com/vickysakata/inkbase.git
cd inkbase
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的本地 PostgreSQL 连接信息和 Pie Gateway 凭证。

### 4. 安装依赖 & 初始化数据库

```bash
npm install
npx prisma migrate deploy
```

### 5. 启动

```bash
npm run dev
```

打开 http://localhost:3000

## 数据隐私

| 数据 | 位置 | 说明 |
|------|------|------|
| 文档原文 | 🏠 本地 PostgreSQL | 不上云 |
| 向量 (embedding) | 🏠 本地 PostgreSQL | 不上云 |
| embedding 计算 | ☁️ Pie Gateway | 仅传输处理，不存储 |

## 技术栈

- Next.js 15 (App Router)
- Prisma + PostgreSQL
- Pie Gateway (text-embedding-3-small)
