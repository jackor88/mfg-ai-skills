# 工厂AI SaaS平台

面向中小制造企业的智能化解决方案平台，提供AI核价、生产跟单、成本核算、ERP集成等核心能力。

## 技术架构

- **前端**: React 18 + TypeScript + Ant Design Pro 6 + Vite
- **业务中台**: NestJS 10 + TypeScript + Node.js 20（DDD模块化架构）
- **AI核价引擎**: FastAPI + Python 3.11 + Pydantic v2
- **数据库**: MySQL 8.0 + Redis 7
- **消息队列**: RabbitMQ
- **容器化**: Docker + Kubernetes
- **基础设施**: 阿里云（ACK/RDS/Redis/OSS/SLB）

## 项目结构

```
factory-ai-saas/
├── apps/
│   ├── web/                          # React前端应用
│   ├── api-gateway/                  # API网关配置
│   └── backend/
│       ├── business-platform/        # NestJS业务中台
│       └── ai-pricing-engine/        # FastAPI AI核价引擎
├── packages/
│   ├── shared-types/                 # 前后端共享TypeScript类型
│   └── eslint-config/                # 共享ESLint配置
├── deploy/
│   ├── docker/                       # Docker相关配置
│   ├── k8s/                          # K8s部署配置(Helm)
│   └── scripts/                      # 部署脚本
├── docs/                             # 项目文档
│   └── superpowers/specs/            # 设计文档与实施计划
├── docker-compose.yml                # 本地开发环境
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Python >= 3.11
- Docker & Docker Compose

### 1. 启动基础设施

```bash
# 启动MySQL、Redis、RabbitMQ
pnpm docker:up

# 查看服务日志
pnpm docker:logs

# 停止服务
pnpm docker:down
```

服务访问地址：
- MySQL: localhost:3306 (root/factory123456, db: factory_ai_platform)
- Redis: localhost:6379 (密码: factory123456)
- RabbitMQ管理界面: http://localhost:15672 (factory/factory123456)

### 2. 安装依赖

```bash
# 安装根目录依赖
pnpm install

# 安装Python依赖（AI核价引擎）
cd apps/backend/ai-pricing-engine
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env
```

### 4. 启动开发服务

```bash
# 启动所有服务（待完善）
pnpm dev

# 单独启动业务中台
cd apps/backend/business-platform
pnpm dev

# 单独启动AI核价引擎
cd apps/backend/ai-pricing-engine
python -m app.main
# 或使用uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

服务访问地址：
- 业务中台API: http://localhost:3000
- Swagger文档: http://localhost:3000/api/docs
- AI核价引擎: http://localhost:8000
- AI核价引擎文档: http://localhost:8000/docs

## 核心模块（业务中台）

| 模块 | 说明 |
|------|------|
| tenant | 租户与IAM（多租户管理、用户认证、RBAC权限） |
| pricing | 核价业务（BOM物料、核价单、审批流程） |
| tracking | 跟单看板（生产工单、进度跟踪、异常预警） |
| cost-accounting | 成本核算（成本归集、成本分析、报表） |
| erp-integration | ERP集成（金蝶/用友/SAP适配器、数据同步） |
| billing | 计费支付（订阅套餐、支付对接、发票） |
| system | 系统管理（字典、日志、配置） |

## 开发规范

- 统一API响应格式: `{ code: number, data: T, message: string }`
- 代码风格: ESLint + Prettier
- Git提交: Conventional Commits规范
- API路径前缀: `/api/v1/`

## 文档

- [设计文档](docs/superpowers/specs/2026-06-24-factory-ai-saas-design.md)
- [实施计划](docs/superpowers/specs/2026-06-24-factory-ai-saas-implementation-plan.md)

## 许可证

MIT
