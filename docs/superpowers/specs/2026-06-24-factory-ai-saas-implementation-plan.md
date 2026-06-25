# 工厂AI SaaS平台实施计划

**日期**: 2026-06-24
**设计文档**: [2026-06-24-factory-ai-saas-design.md](./2026-06-24-factory-ai-saas-design.md)

---

## 阶段0：项目初始化与基础设施（优先级：最高）

### 任务0.1：Monorepo项目结构初始化
- 初始化pnpm workspace + Turborepo
- 创建根目录配置文件（package.json, pnpm-workspace.yaml, turbo.json, .gitignore, .eslintrc, .prettierrc）
- 创建目录结构：apps/, packages/, deploy/
- 配置共享ESLint、Prettier、TypeScript配置

### 任务0.2：Docker Compose本地开发环境
- 编写docker-compose.yml：MySQL 8.0, Redis 7, RabbitMQ（带管理界面）
- 配置数据卷持久化
- 编写健康检查脚本
- 提供一键启动/停止命令

### 任务0.3：Git提交规范配置
- 配置commitlint + Husky
- 配置lint-staged
- 约定式提交规范（Conventional Commits）

---

## 阶段1：业务中台 - NestJS核心框架（优先级：最高）

### 任务1.1：NestJS项目初始化
- 使用Nest CLI创建business-platform项目
- 配置TypeScript、路径别名
- 集成Swagger/OpenAPI文档
- 配置全局异常过滤器、响应拦截器
- 集成pino结构化日志 + traceId链路追踪

### 任务1.2：数据库与TypeORM配置
- 集成TypeORM
- 配置多数据源支持（共享库 + 租户独立库）
- 编写基础Entity基类（id, createdAt, updatedAt, tenantId, deletedAt）
- 集成数据库迁移（migration）
- 配置数据库连接池

### 任务1.3：公共模块开发
- 配置模块（@nestjs/config）：环境变量、多环境配置
- 缓存模块：Redis集成，通用缓存服务
- 消息队列模块：RabbitMQ集成，事件发布/订阅
- 工具类模块：通用工具函数（日期、加密、ID生成等）

---

## 阶段2：多租户与认证授权（优先级：最高）

### 任务2.1：租户管理模块
- Tenant实体定义
- 租户CRUD API
- 租户状态管理（正常/过期/禁用）
- 租户套餐配置

### 任务2.2：用户与认证模块
- User实体定义
- 用户注册/登录（手机号+验证码、账号密码）
- JWT Token生成与验证（access_token + refresh_token）
- 密码加密（bcrypt）
- 全局JWT认证Guard

### 任务2.3：RBAC权限系统
- Role、Permission实体定义
- 角色CRUD、权限分配
- 用户-角色关联、角色-权限关联
- 权限Guard（基于角色/基于权限）
- 接口权限装饰器（@RequirePermissions）

### 任务2.4：多租户拦截器
- TenantInterceptor：自动从JWT解析tenantId
- 自动注入tenantId到查询/插入/更新
- 多租户数据源切换逻辑（支持独立租户库）
- 租户数据越权访问防护

---

## 阶段3：AI核价引擎 - FastAPI服务（优先级：高）

### 任务3.1：FastAPI项目初始化
- 创建Python项目结构
- 配置Pydantic v2、SQLAlchemy 2.0
- 集成uvicorn异步服务器
- 配置CORS、全局异常处理
- 自动生成OpenAPI文档

### 任务3.2：核价引擎基础框架
- 成本计算模型基础框架
- 物料、工艺数据结构定义
- 历史价格查询接口
- 规则引擎基础（AI不可用时降级方案）

### 任务3.3：服务间通信
- JWT服务间认证
- HTTP客户端调用业务中台接口
- 异步任务处理（核价计算可能耗时）
- 核价结果回调机制

---

## 阶段4：前端框架 - React + Ant Design Pro（优先级：高）

### 任务4.1：前端项目初始化
- 使用Ant Design Pro脚手架创建
- 配置Vite构建
- 集成TypeScript
- 配置路由、布局框架

### 任务4.2：前端基础设施
- 封装axios请求（统一响应格式、错误处理、Token注入）
- 登录/登出页面
- 权限路由（根据权限动态生成菜单）
- 全局状态管理（dva或zustand）
- 国际化配置（中文优先）

---

## 阶段5：核心业务模块（优先级：中）

### 任务5.1：核价业务模块
- BOM物料库管理
- 工艺路线管理
- 核价单CRUD
- 核价单审批流程
- 与AI核价引擎对接

### 任务5.2：跟单看板模块
- 生产工单管理
- 生产进度上报（支持移动端）
- WebSocket实时推送
- 甘特图看板
- 异常预警配置与处理

### 任务5.3：系统管理模块
- 字典管理
- 操作日志
- 文件上传（OSS集成）
- 系统配置

---

## 阶段6：ERP集成与计费支付（优先级：中）

### 任务6.1：ERP集成模块
- ERP适配器接口定义
- 金蝶云星空适配器
- 用友U8适配器
- 数据同步日志
- 同步任务调度

### 任务6.2：计费支付模块
- 订阅套餐管理
- 用量统计
- 支付宝支付集成
- 微信支付集成
- 发票管理

---

## 阶段7：部署与DevOps（优先级：中）

### 任务7.1：Docker镜像构建
- 业务中台Dockerfile
- AI核价引擎Dockerfile
- 前端Nginx配置与Dockerfile
- 多阶段构建优化镜像大小

### 任务7.2：K8s部署配置
- Helm Chart编写
- ConfigMap、Secret配置
- Ingress配置
- HPA自动扩缩容
- 健康检查与就绪探针

### 任务7.3：监控与日志
- ARMS集成配置
- 日志采集配置
- 告警规则配置

---

## 里程碑

| 里程碑 | 内容 | 预计完成 |
|--------|------|----------|
| M1 | 阶段0-2完成（项目框架、认证、多租户） | 可用MVP基础框架 |
| M2 | 阶段3-4完成（AI核价引擎、前端框架） | 可登录、可调用AI核价 |
| M3 | 阶段5完成（核价+跟单业务） | 核心业务可用 |
| M4 | 阶段6-7完成（ERP集成、计费、部署） | 生产就绪 |

---

## 第一步执行计划

从**阶段0**开始，先初始化Monorepo项目结构和Docker Compose本地开发环境。
