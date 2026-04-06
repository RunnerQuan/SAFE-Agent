# 🔐 SAFE-Agent

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css" />
</p>

<p align="center">
  <strong>AI Agent 安全合规检测平台</strong><br/>
  智能 · 全面 · 可信
</p>

---

## 📋 项目简介

**SAFE-Agent** 是一个面向 AI Agent 应用的安全合规检测平台，旨在帮助开发者和企业识别、评估并修复智能体应用中的潜在安全风险。平台整合了多种先进的安全检测技术，提供从技能可信度验证到数据过度暴露检测，再到组合式漏洞挖掘的全方位安全扫描能力。

### 🎯 核心能力

| 检测模块 | 功能描述 | 技术特点 |
|---------|---------|---------|
| **SkillPecker** | 技能可信安全检测 | 多智能体协作评估，覆盖恶意提示、隐私泄露、越狱攻击等风险 |
| **AgentRaft** | 数据过度暴露检测 | Source-Sink 分析 + 多 LLM 投票机制，精准识别敏感数据泄露 |
| **MTAtlas** | 组合式漏洞检测 | 静态污点分析 + Fuzzing 技术，发现复杂攻击链 |

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │   React     │  │   Tailwind CSS      │  │
│  │   14.2      │  │   18.3      │  │   3.4               │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ TypeScript  │  │ TanStack    │  │   shadcn/ui         │  │
│  │   5.5       │  │   Query     │  │   Components        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API 代理层 (Proxy)                       │
│              统一路由转发 / 跨域处理 / 请求聚合                  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   SkillPecker   │ │    AgentRaft    │ │    MTAtlas      │
│    (Python)     │ │    (Python)     │ │    (Python)     │
│                 │ │                 │ │                 │
│ • 多智能体评估   │ │ • Source-Sink   │ │ • 污点分析       │
│ • 规则引擎      │ │   分析          │ │ • Fuzzing       │
│ • LLM 集成      │ │ • 调用链追踪     │ │ • 攻击链生成     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.17.0 或更高版本
- **Python**: 3.11 或更高版本
- **包管理器**: npm / yarn / pnpm（前端）, uv（后端）

### 1. 克隆项目

```bash
git clone <repository-url>
cd SAFE-Agent
```

### 2. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 配置后端 API 地址

# 启动开发服务器
npm run dev
```

前端服务默认运行在: http://localhost:3000

### 3. 后端启动

#### SkillPecker

```bash
cd backend/skillpecker

# 使用 uv 安装依赖
uv pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 配置 LLM API 密钥等

# 启动服务
python main.py
```

#### AgentRaft

```bash
cd backend/agentRaft

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

#### MTAtlas

```bash
cd backend/MTAtlas

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

---

## 📁 项目结构

```
SAFE-Agent/
├── frontend/                          # 前端应用
│   ├── app/                          # Next.js App Router
│   │   ├── (main)/                   # 主布局路由组
│   │   │   ├── scans/                # 检测任务相关页面
│   │   │   │   ├── page.tsx          # 任务列表
│   │   │   │   ├── [id]/page.tsx     # 任务详情
│   │   │   │   └── new/page.tsx      # 新建任务
│   │   │   ├── settings/             # 系统设置
│   │   │   └── page.tsx              # 首页仪表板
│   │   ├── api/                      # API 路由（代理层）
│   │   ├── layout.tsx                # 根布局
│   │   └── globals.css               # 全局样式
│   ├── components/                   # React 组件
│   │   └── ui/                       # shadcn/ui 组件
│   ├── lib/                          # 工具函数
│   │   ├── server/                   # 服务端逻辑
│   │   │   ├── skillpecker-service.ts
│   │   │   ├── agentraft-service.ts
│   │   │   └── mtatlas-service.ts
│   │   └── utils.ts                  # 通用工具
│   ├── types/                        # TypeScript 类型定义
│   └── public/                       # 静态资源
│
├── backend/                          # 后端服务
│   ├── skillpecker/                  # 技能可信检测
│   │   ├── main.py                   # FastAPI 入口
│   │   ├── agents/                   # 智能体实现
│   │   ├── detectors/                # 检测规则
│   │   ├── scan-results/             # 检测结果存储
│   │   └── requirements.txt
│   │
│   ├── agentRaft/                    # 数据过度暴露检测
│   │   ├── main.py                   # FastAPI 入口
│   │   ├── agents/                   # 分析智能体
│   │   ├── data/                     # 工作区数据
│   │   └── requirements.txt
│   │
│   └── MTAtlas/                      # 组合式漏洞检测
│       ├── main.py                   # FastAPI 入口
│       ├── static_analyzer/          # 静态分析器
│       ├── fuzzer/                   # Fuzzing 引擎
│       ├── data/                     # 工作区数据
│       └── requirements.txt
│
└── README.md                         # 项目文档
```

---

## 🔍 检测流程详解

### SkillPecker - 技能可信检测

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   用户输入   │───▶│ Triage Agent│───▶│Security Agent│───▶│ Judge Agent │
│   技能信息   │    │  意图识别    │    │  安全分析    │    │  结果判定    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
                                                       ┌─────────────┐
                                                       │  检测报告    │
                                                       │ • 风险等级   │
                                                       │ • 漏洞详情   │
                                                       │ • 修复建议   │
                                                       └─────────────┘
```

**检测维度**:
- 恶意提示注入 (Malicious Prompt Injection)
- 隐私数据泄露 (Privacy Data Leakage)
- 越狱攻击 (Jailbreak Attack)
- 提示泄露 (Prompt Leakage)
- 不安全的数据处理 (Insecure Data Processing)

### AgentRaft - 数据过度暴露检测

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   智能体    │───▶│  Source-Sink    │───▶│   调用链分析     │
│   代码      │    │   污点分析       │    │   路径追踪       │
└─────────────┘    └─────────────────┘    └─────────────────┘
                                                   │
                           ┌───────────────────────┼───────────────────────┐
                           ▼                       ▼                       ▼
                    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
                    │  LLM 投票 1 │         │  LLM 投票 2 │         │  LLM 投票 N │
                    │ (DeepSeek)  │         │  (OpenAI)   │         │ (Claude)    │
                    └─────────────┘         └─────────────┘         └─────────────┘
                           │                       │                       │
                           └───────────────────────┼───────────────────────┘
                                                   ▼
                                            ┌─────────────┐
                                            │  综合判定    │
                                            │ 数据泄露风险 │
                                            └─────────────┘
```

**核心能力**:
- 自动识别 Source 点（敏感数据源）
- 追踪 Sink 点（数据输出位置）
- 多 LLM 投票降低误报率
- 生成详细的泄露路径报告

### MTAtlas - 组合式漏洞检测

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   智能体    │───▶│   静态污点分析   │───▶│  候选攻击链生成  │
│   代码      │    │  数据流追踪      │    │  路径组合       │
└─────────────┘    └─────────────────┘    └─────────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  Fuzzing    │
                                            │  引擎测试    │
                                            │ 攻击链有效性 │
                                            └─────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  漏洞报告    │
                                            │ • 攻击路径   │
                                            │ • 风险等级   │
                                            │ • 修复建议   │
                                            └─────────────┘
```

**技术特点**:
- 基于 AST 的静态分析
- 跨函数/跨文件的数据流追踪
- 智能攻击链生成与验证
- 支持多种智能体框架

---

## 📊 检测结果

平台提供详细的检测报告，包括：

| 信息类别 | 内容说明 |
|---------|---------|
| **基础信息** | 任务 ID、创建时间、检测状态、目标技能 |
| **风险概览** | 风险等级（高危/中危/低危/安全）、风险分数 |
| **详细发现** | 漏洞类型、位置、描述、修复建议 |
| **调用链** | 完整的工具调用链，支持展开/收起查看 |
| **原始数据** | 完整的检测输出，支持 JSON 格式导出 |

### 风险等级说明

- 🔴 **高危**: 存在严重的安全漏洞，建议立即修复
- 🟠 **中危**: 存在安全风险，建议在近期修复
- 🟡 **低危**: 存在轻微安全问题，可根据情况修复
- 🟢 **安全**: 未检测到明显安全风险

---

## ⚙️ 配置说明

### 前端配置

**文件**: `frontend/.env.local`

```env
# API 代理配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# 各后端服务地址（开发环境）
SKILLPECKER_API_URL=http://localhost:8000
AGENTRAFT_API_URL=http://localhost:8001
MTATLAS_API_URL=http://localhost:8002
```

### 后端配置

**SkillPecker** (`backend/skillpecker/.env`):

```env
# LLM API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# 服务配置
HOST=0.0.0.0
PORT=8000
```

**AgentRaft** (`backend/agentRaft/.env`):

```env
# LLM 配置
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
LLM_API_KEY=your_api_key

# 服务配置
PORT=8001
```

**MTAtlas** (`backend/MTAtlas/.env`):

```env
# 服务配置
PORT=8002

# 分析配置
MAX_ANALYSIS_DEPTH=10
ENABLE_FUZZING=true
```

---

## 🛡️ 安全检测规则

平台内置多种安全检测规则，覆盖常见的智能体安全风险：

| 规则类别 | 规则名称 | 描述 |
|---------|---------|------|
| 提示安全 | `malicious_prompt_detector` | 检测恶意提示注入 |
| 提示安全 | `jailbreak_detector` | 检测越狱攻击尝试 |
| 提示安全 | `prompt_leakage_detector` | 检测提示词泄露 |
| 数据安全 | `privacy_leakage_detector` | 检测隐私数据泄露 |
| 数据安全 | `data_exposure_detector` | 检测数据过度暴露 |
| 代码安全 | `insecure_code_detector` | 检测不安全代码模式 |
| 执行安全 | `dangerous_execution_detector` | 检测危险代码执行 |

---

## 🤝 贡献指南

我们欢迎社区贡献！如果您想为 SAFE-Agent 做出贡献，请遵循以下步骤：

1. **Fork 项目**: 在 GitHub 上 Fork 本仓库
2. **创建分支**: `git checkout -b feature/your-feature-name`
3. **提交更改**: `git commit -m 'Add some feature'`
4. **推送分支**: `git push origin feature/your-feature-name`
5. **创建 PR**: 提交 Pull Request 到主仓库

### 开发规范

- 遵循现有代码风格和目录结构
- 提交前运行测试确保无错误
- 更新相关文档
- PR 描述清晰说明改动内容

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

---

## 📞 联系我们

如有问题或建议，欢迎通过以下方式联系我们：

- **GitHub Issues**: [提交问题](https://github.com/RunnerQuan/SAFE-Agent/issues)
- **Email**: runnerquan@foxmail.com

---

<p align="center">
  <strong>SAFE-Agent</strong> - 让 AI Agent 更安全
</p>
