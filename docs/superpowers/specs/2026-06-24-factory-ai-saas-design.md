# 工厂AI SaaS平台设计文档

**日期**: 2026-06-24
**架构选型**: 领域驱动微服务（DDD Microservices）- 渐进式方案
**部署模式**: 混合部署（公有云SaaS + 大型工厂私有部署）

---

## 1. 整体架构设计

### 1.1 架构策略：渐进式微服务

采用"模块化单体→微服务"的渐进式演化路径：
- **初期3个核心服务起步**：业务中台（NestJS）+ AI核价引擎（FastAPI）+ 消息基础设施
- **业务中台内部分模块**：严格按DDD限界上下文划分模块，为未来拆分预留清晰边界
- **AI服务独立部署**：核价引擎用Python独立部署，便于模型迭代和团队分工
- **容器化支撑**：基于K8s，一套镜像同时支持公有云和私有部署

### 1.2 系统分层架构

| 层级 | 组件 | 技术选型 |
|------|------|----------|
| 用户层 | PC浏览器 / 移动端H5 | React 18 + Ant Design Pro 6 |
| 接入层 | CDN / 阿里云SLB / API网关 | 阿里云CDN + SLB + API网关/Kong |
| 应用服务层 | 业务中台服务 | NestJS 10 + TypeScript + Node.js 20 |
| AI服务层 | AI核价引擎服务 | FastAPI + Python 3.11 |
| 消息层 | 异步消息与任务调度 | RabbitMQ / 阿里云RocketMQ + Redis 7 |
| 数据层 | 数据库 / 缓存 / 存储 | 阿里云RDS MySQL 8.0 + Redis 7 + OSS |
| 基础设施层 | 容器编排 / 监控 | 阿里云ACK（K8s）+ ARMS监控 |

### 1.3 核心服务职责

**业务中台服务（NestJS）**：
- 用户/租户管理、认证授权（RBAC）
- 跟单看板、成本核算
- ERP集成、计费支付
- 核价单管理与审批流程

**AI核价引擎服务（FastAPI）**：
- 成本计算模型、AI报价推荐
- 工艺参数优化、历史价格分析
- 支持GPU调度，独立迭代模型

---

## 2. 业务中台模块划分

采用NestJS Modular Monolith架构，每个模块对应DDD限界上下文：

| 模块 | 职责 | 未来拆分优先级 |
|------|------|----------------|
| tenant（租户与IAM） | 多租户管理、用户认证、RBAC权限、组织架构 | ⭐⭐ 中台核心，长期保留 |
| pricing（核价业务） | 核价单、BOM物料、工艺路线、审批流程 | ⭐⭐⭐ 业务增长后独立 |
| tracking（跟单看板） | 生产工单、进度跟踪、甘特图、异常预警 | ⭐⭐⭐ 独立支持WebSocket |
| cost-accounting（成本核算） | 成本归集、成本分析、毛利计算、报表 | ⭐⭐ 与核价关联紧密，后期考虑 |
| erp-integration（ERP集成） | ERP适配器、数据同步、金蝶/用友/SAP对接 | ⭐⭐⭐⭐ 最先独立成集成服务 |
| billing（计费支付） | 订阅套餐、用量计费、支付宝/微信支付、发票 | ⭐⭐⭐⭐ 独立成通用支付服务 |
| system（系统管理） | 字典配置、操作日志、文件管理、系统设置 | ⭐ 保留在中台 |

### 2.1 模块间通信原则
- **同步调用**：通过NestJS依赖注入调用内部Service接口，禁止跨模块直接访问数据库
- **异步事件**：领域事件通过Redis/RabbitMQ发布订阅（如：核价单审批通过→通知跟单模块）
- **数据隔离**：每个模块拥有独立表名前缀，禁止跨模块直接查表

---

## 3. 多租户设计

### 3.1 隔离方案：共享数据库 + 租户ID字段隔离

- 所有租户共享同一个RDS实例和数据库
- 每张业务表包含`tenant_id`字段
- TypeORM拦截器自动在查询中注入`tenant_id`条件
- 支持大客户独立数据库（通过配置切换数据源）

### 3.2 多租户请求流程
```
请求 → JWT认证解析user_id/tenant_id →
  → 租户状态检查（过期/禁用）→
    → RBAC权限校验 →
      → TypeORM TenantInterceptor自动注入tenant_id →
        → 业务逻辑执行 →
          → 操作日志记录 → 返回响应
```

### 3.3 私有部署支持
- K8s Helm Chart支持单租户模式
- 配置开关：`MULTI_TENANT_ENABLED=true/false`
- 单租户模式自动关闭多租户拦截器

---

## 4. 技术栈与项目结构

### 4.1 技术栈选型

| 领域 | 技术选型 |
|------|----------|
| 前端 | React 18 + TypeScript + Ant Design Pro 6 + Vite |
| 业务后端 | NestJS 10 + TypeScript + Node.js 20 |
| AI后端 | FastAPI + Python 3.11 + Pydantic v2 + SQLAlchemy 2.0 |
| ORM | TypeORM（NestJS）、SQLAlchemy 2.0（Python） |
| 数据库 | MySQL 8.0、Redis 7 |
| 消息队列 | RabbitMQ / 阿里云RocketMQ |
| 容器化 | Docker + Kubernetes（阿里云ACK） |
| API文档 | Swagger/OpenAPI自动生成 |
| 认证 | JWT + OAuth2 + RBAC |
| Monorepo | pnpm workspace + Turborepo |

### 4.2 Monorepo项目结构

```
factory-ai-saas/
├── apps/
│   ├── web/                    # React前端 (Ant Design Pro)
│   ├── api-gateway/            # API网关配置
│   └── backend/
│       ├── business-platform/  # NestJS业务中台
│       │   └── src/modules/    # 7个业务模块
│       └── ai-pricing-engine/  # FastAPI AI核价引擎
├── packages/
│   ├── shared-types/           # 前后端共享类型
│   ├── ui-components/          # 共享UI组件库
│   └── eslint-config/          # 共享ESLint配置
├── deploy/
│   ├── docker/                 # Dockerfile
│   ├── k8s/                    # K8s manifests (Helm chart)
│   └── scripts/                # 部署脚本
├── docs/                       # 项目文档
├── docker-compose.yml          # 本地开发环境
├── pnpm-workspace.yaml
└── turbo.json
```

### 4.3 开发规范
- 统一API响应格式：`{ code: number, data: T, message: string }`
- 全局异常过滤器 + 业务错误码体系
- 结构化日志（pino）+ traceId链路追踪
- API路径前缀：`/api/v1/`
- ESLint + Prettier + Husky提交钩子

---

## 5. 核心数据模型

### 5.1 租户与用户域
- `tenants` - 租户表：企业信息、套餐等级、过期时间、配置
- `users` - 用户表：租户ID、用户名、手机号、邮箱、密码哈希、状态
- `roles` - 角色表：租户ID、角色名、角色编码、描述
- `permissions` - 权限表：权限标识、权限名、分组
- `role_permissions`、`user_roles` - 关联表
- `organizations` - 组织架构表：部门树

### 5.2 核价业务域
- `pricing_orders` - 核价单：核价单号、客户、产品、状态、总报价
- `pricing_order_items` - 核价明细：物料、工艺、工时、单价
- `bom_materials` - BOM物料库：物料编码、规格、分类、最新采购价
- `process_routes` - 工艺路线：工序、标准工时、设备、成本
- `approval_flows` - 审批流程：审批节点、审批人、状态、意见

### 5.3 跟单看板域
- `production_orders` - 生产工单：关联核价单、计划时间、实际进度、状态
- `production_progress` - 进度记录：工序、完成数量、不良品、上报人
- `production_alerts` - 异常预警：异常类型、等级、处理状态

### 5.4 计费支付域
- `subscriptions` - 订阅：租户ID、套餐、起止时间、状态
- `usage_records` - 用量记录：核价次数、API调用量、存储
- `payments` - 支付记录：订单号、金额、支付方式、状态、交易号
- `invoices` - 发票记录：开票信息、金额、状态、PDF地址

### 5.5 ERP集成域
- `erp_connections` - ERP连接配置：ERP类型、连接参数、同步配置
- `erp_sync_logs` - 同步日志：同步类型、状态、数据量、错误信息

---

## 6. 关键业务流程

### 6.1 AI核价流程
```
用户创建核价单 → 填写产品信息/BOM →
  → 调用AI核价引擎（预估价格，超时降级规则引擎）→
    → 人工调整确认 →
      → 提交审批 →
        → 审批通过 →
          → 生成正式报价单 → 事件通知跟单模块
```

### 6.2 生产跟单流程
```
核价单审批通过 → 自动创建生产工单 →
  → 工序分派 →
    → 车间移动端上报进度 →
      → WebSocket实时推送看板更新 →
        → 延期/异常自动预警 →
          → 工单完成 → 触发成本核算
```

### 6.3 ERP数据同步流程
```
定时/手动触发 → 读取ERP配置 →
  → 适配器转换数据格式 →
    → 增量拉取/推送 →
      → 数据校验清洗 →
        → 写入业务表 →
          → 记录同步日志 → 失败重试3次 → 告警通知
```
- 适配器模式：插件化支持金蝶云星空、用友U8、SAP B1等主流ERP

---

## 7. 部署与运维

### 7.1 本地开发环境
Docker Compose一键启动：
- MySQL 8.0、Redis 7、RabbitMQ（管理界面）
- 业务中台（NestJS热重载）
- AI核价引擎（FastAPI热重载）
- 前端React（Vite dev server）

### 7.2 公有云SaaS部署（阿里云）
- ACK容器服务K8s集群
- RDS高可用版、Redis集群版
- SLB多可用区负载均衡
- ARMS应用监控、链路追踪
- 日志服务SLS集中化日志

### 7.3 私有部署
- Helm Chart一键部署
- 支持离线环境部署
- 单租户模式关闭多租户逻辑
- 提供运维监控面板
