# Writing Buddy（写作伙伴）

一款 AI 辅导应用，帮助 10-11 岁的学生备考英国 11+ 创意写作考试。不同于直接替学生改写的 AI 工具，Writing Buddy 提供迭代式的、保留学生个人风格的辅导，引导学生改进自己的作品。

属于 11+ 备考套件的一部分，与 [vocab-master](https://github.com/DanWangDev/vocab-master) 搭配使用。共享认证基础设施，支持订阅制。

[English](README.md)

## 工作原理

1. **选择题目** — 从创意写作题库中选择，每道题目标注了体裁、时间限制和字数目标
2. **开始写作** — 在笔记本风格的书桌上创作，配有实时计时器
3. **获取辅导** — AI 进行多轮辅导：语言优化、叙事结构、描写深度和润色打磨
4. **查看修改** — 通过逐词差异对比，清晰看到每次修改的内容
5. **获得评分** — 收到基于评分标准的详细反馈，涵盖每个维度

## 架构

```
                              ┌──────────────────────────────────────┐
                              │          11plus-hub (OIDC)            │
                              │         Express · port 3009           │
                              │    session store · user management    │
                              └──────────────┬───────────────────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │  OIDC (PKCE)       │   hub network      │
                        │  login/logout      │   (Docker bridge)  │
                        ▼                    │                    ▼
       ┌────────────────────────────────────┴────────────────────────────────────┐
       │                          Docker Host                                     │
       │                                                                           │
       │  ┌─────────────────────────────┐    ┌──────────────────────────────┐     │
       │  │   Frontend Container        │    │    Backend Container          │     │
       │  │   Nginx :80 (port 5055)     │    │    Express :5050              │     │
       │  │                             │    │                               │     │
       │  │  ┌───────────────────────┐  │    │  ┌────────────────────────┐   │     │
       │  │  │   React 19 SPA        │  │    │  │    中间件栈            │   │     │
       │  │  │   (Vite 构建)         │  │    │  │  helmet · cors         │   │     │
       │  │  │                       │  │    │  │  cookieParser · auth   │   │     │
       │  │  │  页面：               │  │    │  │  requireEntitlement    │   │     │
       │  │  │  ├─ Dashboard         │  │    │  └───────────┬────────────┘   │     │
       │  │  │  ├─ PromptBrowser     │  │    │              │                │     │
       │  │  │  ├─ WritingDesk  ◄────┼──┼────┼───/api/writing/*             │     │
       │  │  │  ├─ CoachingFeedback  │  │    │              │                │     │
       │  │  │  ├─ Portfolio         │  │    │  ┌───────────▼────────────┐   │     │
       │  │  │  ├─ SubmissionDetail  │  │    │  │      API 路由          │   │     │
       │  │  │  └─ AdminPrompts      │  │    │  │                        │   │     │
       │  │  │                       │  │    │  │  /api/auth/*           │   │     │
       │  │  │  上下文：             │  │    │  │  ├─ /login (OIDC)      │   │     │
       │  │  │  └─ AuthContext       │  │    │  │  ├─ /callback          │   │     │
       │  │  │                       │  │    │  │  ├─ /logout            │   │     │
       │  │  │  设计：               │  │    │  │  ├─ /me                │   │     │
       │  │  │  ├─ Bangers 字体      │  │    │  │  └─ /backchannel       │   │     │
       │  │  │  ├─ Comic Neue 字体   │  │    │  │                        │   │     │
       │  │  │  ├─ Tailwind v4       │  │    │  │  /api/writing/*        │   │     │
       │  │  │  └─ Manga Burst       │  │    │  │  ├─ /prompts           │   │     │
       │  │  └───────────────────────┘  │    │  │  ├─ /submissions       │   │     │
       │  │                             │    │  │  ├─ /submissions/:id/  │   │     │
       │  │  ┌───────────────────────┐  │    │  │  │   coaching          │   │     │
       │  │  │  Nginx                │  │    │  │  ├─ /submissions/:id/  │   │     │
       │  │  │  / → SPA fallback     │  │    │  │  │   progress          │   │     │
       │  │  │  /api → backend:5050  │  │    │  │  └─ /submissions/:id/  │   │     │
       │  │  └───────────────────────┘  │    │  │     scoring            │   │     │
       │  └──────────────┬──────────────┘    │  └───────────┬────────────┘   │     │
       │                 │                   │              │                │     │
       │                 │                   │  ┌───────────▼────────────┐   │     │
       │                 │                   │  │      服务层            │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  AICoach               │   │     │
       │                 │                   │  │  ├─ 第1-4轮辅导        │   │     │
       │                 │                   │  │  ├─ ContextBuilder     │   │     │
       │                 │                   │  │  └─ 辅导提示词         │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  RubricScorer          │   │     │
       │                 │                   │  │  └─ 五维度评分标准     │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  ContentSafety         │   │     │
       │                 │                   │  │  ├─ 输入筛查           │   │     │
       │                 │                   │  │  └─ 输出过滤           │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  LLMProvider (接口)    │   │     │
       │                 │                   │  │  ├─ DashScopeAdapter   │   │     │
       │                 │                   │  │  │  (Qwen 模型)        │   │     │
       │                 │                   │  │  └─ ClaudeAdapter      │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  DiffUtil (LCS算法)    │   │     │
       │                 │                   │  │  ProgressService       │   │     │
       │                 │                   │  │  UserSync              │   │     │
       │                 │                   │  └───────────┬────────────┘   │     │
       │                 │                   │              │                │     │
       │                 │                   │  ┌───────────▼────────────┐   │     │
       │                 │                   │  │    数据仓库层          │   │     │
       │                 │                   │  │    (SQLite / WAL)      │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  SubmissionRepository  │   │     │
       │                 │                   │  │  CoachingPassRepository│   │     │
       │                 │                   │  │  ProgressRepository    │   │     │
       │                 │                   │  │  RevisionRepository    │   │     │
       │                 │                   │  │  RubricScoresRepository│   │     │
       │                 │                   │  │  PromptRepository      │   │     │
       │                 │                   │  │  UserRepository        │   │     │
       │                 │                   │  │  AppUserRepository     │   │     │
       │                 │                   │  └────────────────────────┘   │     │
       │                 │                   │                                │     │
       │                 │                   │  ┌────────────────────────┐   │     │
       │                 │                   │  │  writing-buddy.db      │   │     │
       │                 │                   │  │  (Docker volume)       │   │     │
       │                 │                   │  └────────────────────────┘   │     │
       │                 │                   └────────────────────────────────┘     │
       └─────────────────┼──────────────────────────────────────────────────────────┘
                         │
                    ┌────▼────────┐
                    │ Cloudflare  │
                    │ Tunnel      │
                    │ → public    │
                    └─────────────┘
```

## 技术栈

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js_22-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)

</div>

基于 OIDC + PKCE 的会话认证（Hub 提供）。AI 辅导采用 DashScope（Qwen）和 Claude 模型。使用 Tailwind v4 + Manga Burst 新粗野主义设计系统。通过 Docker Compose 部署于 Cloudflare Tunnel 之后。

### 前端

| 关注点 | 技术选型 | 备注 |
|--------|----------|------|
| 框架 | React 19 | 最新稳定版，函数组件 + Hooks |
| 构建工具 | Vite 7 | HMR 开发服务器，生产构建打包 |
| 样式 | Tailwind CSS v4 | 实用优先，自定义设计令牌 |
| 路由 | React Router 7 | 客户端路由，受保护路由 |
| HTTP 客户端 | `fetch`（原生） | 通过 AuthContext 发起认证请求 |
| 认证状态 | React Context | `AuthContext` 含会话轮询 |
| 图标 | Lucide React | 24px，stroke-width 2 |
| 字体 | Bangers + Comic Neue | Google Fonts CDN |

### 后端

| 关注点 | 技术选型 | 备注 |
|--------|----------|------|
| 框架 | Express 4 | Node.js HTTP 服务器 |
| 数据库 | better-sqlite3 (WAL) | 嵌入式、零配置、单文件 |
| 数据库迁移 | 自定义迁移器 | 版本化、有序的迁移文件 |
| 校验 | Zod | 请求体、环境变量、配置校验 |
| 认证 SDK | `@danwangdev/auth-client` | Hub OIDC + PKCE，基于会话 |
| 安全 | helmet, cors, rate-limit | 标准 Express 安全头 |
| LLM SDK | 基于 fetch | 兼容 OpenAI API 格式（DashScope）+ Anthropic SDK |
| 日志 | 自定义日志服务 | 通过 `logger` 服务输出结构化 JSON 日志 |

### DevOps

| 关注点 | 技术选型 | 备注 |
|--------|----------|------|
| 容器化 | Docker（2 个镜像） | 后端 + 前端通过 docker-compose 编排 |
| 边缘入口 | Cloudflare Tunnel | 公网 HTTPS → Docker 容器 |
| 静态资源 | Nginx（前端容器） | SPA 回退，静态资源缓存 |
| API 代理 | Nginx `/api` → backend:5050 | Docker 内部网络代理 |
| 持久化 | Docker volume（`db-data`） | SQLite 数据库文件 |
| 网络 | `11plus-hub_default` bridge | 与 Hub 共享认证网络 |
| CI | GitHub Actions | 构建、类型检查、Lint、测试 |
| 部署 | `deploy.sh` | `docker compose up -d --build` 一键部署 |

## 项目结构

```
writing-buddy/
├── packages/
│   ├── shared/          # 共享 TypeScript 类型定义
│   ├── backend/         # Express API（端口 5050）
│   └── frontend/        # React SPA（开发端口 5179，生产端口 5055）
├── .github/workflows/   # CI 流水线
├── docker-compose.yml   # 生产环境部署
├── deploy.sh            # 一键重新部署
└── DESIGN.md            # 完整设计系统（Manga Burst 新粗野主义）
```

## 快速开始

### 前置要求

- Node.js >= 22
- npm >= 10

### 安装

```bash
git clone https://github.com/DanWangDev/writing-buddy.git
cd writing-buddy
npm install
```

### 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
# 认证（Hub OIDC）
OIDC_ISSUER=http://localhost:3009
OIDC_INTERNAL_ISSUER=http://hub-app:3009
OIDC_REDIRECT_URI=http://localhost:5055/api/auth/callback
SESSION_SECRET=your-secret-here

# LLM API 密钥
DASHSCOPE_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# CORS
CORS_ORIGIN=http://localhost:5055
CORS_EXTRA_ORIGINS=http://localhost:5179

# VITE
VITE_API_URL=/api
VITE_HUB_URL=http://localhost:3009
```

### 开发

```bash
npm run dev:backend      # 启动后端热重载（端口 5050）
npm run dev:frontend     # 启动前端 Vite 开发服务器（端口 5179）
```

### 测试

```bash
npm test                 # 运行所有测试
npm run test:coverage    # 运行测试并检查覆盖率（目标：80%+）
```

### 构建

```bash
npm run build            # 构建所有包
npm run typecheck        # 类型检查所有包
npm run lint             # 前端 ESLint 检查
```

## 生产环境部署

```bash
./deploy.sh              # Docker Compose 重新部署
```

生产环境运行两个 Docker Compose 容器：
- **后端** — Express API 端口 5050，SQLite 数据通过 Docker volume 持久化
- **前端** — Nginx 提供 React SPA 服务，并将 `/api` 代理到后端（端口 5055）

两个容器均加入 `11plus-hub_default` bridge 网络，与 Hub 进行认证集成。外部流量通过 Cloudflare Tunnel → 前端容器。

## 设计

Writing Buddy 采用 **Manga Burst 新粗野主义**设计系统——大胆的漫画风格，粗墨线边框、硬阴影、鲜艳扁平色彩和网点纹理。Bangers（展示字体）和 Comic Neue（正文字体）。完整设计系统详见 [DESIGN.md](DESIGN.md)。

## 开源协议

MIT
