<div align="center">

# 🎯 408 Review

**计算机考研 408 全科目智能复习助手**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5-1677FF?logo=antdesign&logoColor=white)](https://ant.design/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一个开源的、社区驱动的 408 考研复习平台，涵盖 **数据结构 · 计算机组成原理 · 操作系统 · 计算机网络** 四大科目。

</div>

---

## ✨ 功能特色

| 模块 | 说明 |
|------|------|
| 📊 **学习仪表盘** | 一目了然的复习进度、统计数据和今日待办 |
| 📝 **题库练习** | 按科目/难度/标签筛选，支持答题记录与解析 |
| 🃏 **闪卡背诵** | 500+ 知识点卡片，基于间隔重复算法科学复习 |
| 📖 **知识树** | 四大科目知识点结构化呈现，标记掌握程度 |
| 🤖 **AI 助手** | 接入大语言模型，智能答疑、概念讲解、出题训练 |
| 📈 **统计分析** | 正确率趋势、科目对比、薄弱环节识别 |
| 📋 **错题本** | 自动收录错题，支持标签分类与复习 |
| 📅 **学习计划** | 基础/强化/冲刺三阶段规划，每日任务追踪 |
| 💻 **模拟考试** | 限时模拟，仿真考试体验 |
| ⚙️ **灵活配置** | AI 模型多配置管理、数据导入导出与备份 |

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/your-username/408-review.git
cd 408-review

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后访问 [http://localhost:5173](http://localhost:5173) 即可使用。

### 构建生产版本

```bash
npm run build
npm run preview   # 预览构建结果
```

## 🤖 AI 功能配置

本项目 AI 功能支持 OpenAI 兼容接口（如 DeepSeek、通义千问等）和 Anthropic 接口：

1. 启动应用后进入 **设置** 页面
2. 填写你的 **API 地址**、**API Key** 和 **模型名称**
3. 保存后即可在 AI 助手中使用

> ⚠️ **API Key 仅存储在浏览器本地（localStorage），不会上传至任何服务器。**

## 📂 项目结构

```
408-review/
├── src/
│   ├── components/          # 通用组件
│   │   ├── Layout/          # 页面布局
│   │   └── MarkdownRenderer/# Markdown 渲染器
│   ├── data/                # 静态数据
│   │   ├── questions/       # 各科目题库 (JSON)
│   │   ├── flashcards.json  # 闪卡数据 (500+ 张)
│   │   └── knowledge-tree.json # 知识树
│   ├── db/                  # IndexedDB 数据库层
│   │   ├── index.ts         # Dexie 数据库定义
│   │   └── seed.ts          # 数据初始化与版本迁移
│   ├── features/            # 功能模块
│   │   ├── dashboard/       # 仪表盘
│   │   ├── question-bank/   # 题库练习
│   │   ├── flashcard/       # 闪卡背诵
│   │   ├── knowledge/       # 知识树
│   │   ├── ai-assistant/    # AI 助手
│   │   ├── statistics/      # 统计分析
│   │   ├── error-book/      # 错题本
│   │   ├── study-plan/      # 学习计划
│   │   ├── mock-exam/       # 模拟考试
│   │   └── settings/        # 系统设置
│   ├── services/            # 业务服务层
│   ├── stores/              # Zustand 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 应用入口
│   └── main.tsx             # 渲染入口
├── scripts/                 # 数据生成脚本
│   ├── generate-flashcards.js
│   └── data/                # 各科目卡片数据源
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🧠 闪卡数据

闪卡目前涵盖 **503 张** 知识点卡片，按科目分布：

| 科目 | 卡片数 |
|------|--------|
| 数据结构 | 173 |
| 计算机组成原理 | 128 |
| 操作系统 | 105 |
| 计算机网络 | 97 |

卡片覆盖高、中、低频考点，使用间隔重复算法（Spaced Repetition）安排复习时间。

### 扩充闪卡

闪卡数据通过脚本生成，你可以方便地添加更多知识点：

```bash
# 编辑 scripts/data/ 目录下的数据文件
# 然后重新生成
node scripts/generate-flashcards.js
```

添加卡片的格式：

```js
// 在 scripts/data/ 下的任意文件中
c('知识点名称', '正面（问题）', '背面（答案）')
```

> 生成后需更新 `src/db/seed.ts` 中的 `CURRENT_SEED_VERSION` 版本号，以确保新数据能被加载。

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| [React 18](https://react.dev/) | 前端框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vite](https://vitejs.dev/) | 构建工具 |
| [Ant Design 5](https://ant.design/) | UI 组件库 |
| [Tailwind CSS 4](https://tailwindcss.com/) | 原子化样式 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 状态管理 |
| [Dexie](https://dexie.org/) | IndexedDB 封装 |
| [ECharts](https://echarts.apache.org/) | 数据可视化 |
| [React Router 6](https://reactrouter.com/) | 路由管理 |

## 🤝 参与贡献

这是一个开源项目，欢迎所有人为 408 考研复习贡献力量！

### 贡献方式

- **补充题库** — 在 `src/data/questions/` 下添加更多真题和练习题
- **扩充闪卡** — 在 `scripts/data/` 下添加知识点卡片
- **完善知识树** — 更新 `src/data/knowledge-tree.json` 中的知识结构
- **修复 Bug** — 提交 Issue 或直接 PR
- **功能建议** — 提交 Issue 描述你的想法

### 提交规范

```bash
# Fork → Clone → Branch → Code → PR
git checkout -b feature/your-feature
git commit -m "feat: 添加 xxx 功能"
git push origin feature/your-feature
# 然后在 GitHub 上创建 Pull Request
```

## 📄 许可证

[MIT License](LICENSE) — 自由使用、修改和分发。

---

<div align="center">

**祝所有考研人一战成硕！**

</div>
