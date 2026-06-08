# 参与贡献

感谢你对 **NJUPT-408Review-Agent** 的关注！这是一个社区驱动的 408 考研复习项目，任何形式的贡献都欢迎。

## 如何贡献

### 报告问题

- 在 [Issues](https://github.com/sengo0723/NJUPT-408Review-Agent/issues) 中搜索是否已有类似问题
- 如果没有，创建新 Issue，包含：
  - 问题描述（遇到了什么问题）
  - 复现步骤
  - 浏览器和系统信息
  - 期望行为 vs 实际行为

### 提交代码

1. **Fork** 本仓库到你的 GitHub 账号
2. 从 `main` 创建功能分支：
   ```bash
   git checkout -b feature/your-feature
   ```
3. 开发并测试你的改动
4. 提交代码（见下方提交规范）
5. 推送到你的 Fork：
   ```bash
   git push origin feature/your-feature
   ```
6. 在 GitHub 上创建 **Pull Request**，描述你的改动内容

### 贡献数据

这是最容易上手、也最需要的贡献方式！

#### 补充题库

在 `src/data/questions/` 目录下找到对应科目的 JSON 文件，按已有格式添加题目：

```json
{
  "id": "ds-xxx",
  "subject": "data-structure",
  "type": "choice",
  "difficulty": "medium",
  "question": "题目内容",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "B",
  "explanation": "解析内容"
}
```

> `id` 格式建议：科目缩写-编号（如 `ds-201`、`co-105`），请确保不与已有 ID 重复。

#### 扩充闪卡

在 `scripts/data/` 目录下找到对应科目文件，按格式添加：

```js
c('知识点名称', '正面（问题）', '背面（答案）')
```

然后运行生成脚本：

```bash
node scripts/generate-flashcards.js
```

最后更新 `src/db/seed.ts` 中的 `CURRENT_SEED_VERSION` 版本号（+1）。

#### 完善知识树

编辑 `src/data/knowledge-tree.json`，按已有结构添加或调整知识点节点。

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>: <description>
```

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `data` | 题库/闪卡/知识树等数据更新 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `chore` | 构建/工具链变更 |

示例：
- `feat: 添加历年真题按年份筛选功能`
- `data: 补充操作系统内存管理 20 张闪卡`
- `fix: 修复模拟考试计时器不暂停的问题`

## 开发指南

### 本地运行

```bash
npm install
npm run dev
```

### 项目结构

```
src/
├── components/       # 通用组件
├── data/             # 静态数据（题库、闪卡、知识树）
├── db/               # IndexedDB 数据库层
├── features/         # 功能模块页面
├── services/         # 业务服务
├── stores/           # 状态管理
├── types/            # 类型定义
└── utils/            # 工具函数
```

### 代码风格

- TypeScript 严格模式
- React 函数组件 + Hooks
- 组件文件使用 PascalCase，工具/服务文件使用 camelCase
- 请勿提交 `console.log` 等调试代码

## 行为准则

- 尊重所有贡献者
- 建设性的讨论和反馈
- 专注内容质量，确保知识点准确性
- 题目解析要清晰完整，帮助理解而非仅仅给出答案

---

再次感谢你的贡献！每一个知识点、每一道题目都能帮助到正在备考的同学们。
