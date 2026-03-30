# Super Review Prompt 模板

本目录包含 Super Review Skill 使用的审查模板。

## 模板列表

| 模板文件 | 用途 | 适用场景 |
|---------|------|---------|
| `unified-review.md` | **V2 统一审查模板** | 代码审查、commit 审查（默认） |
| `beginner-tutorial.md` | 初学者教程审查 | 教程类文档的新手友好度评估 |
| `expert-tutorial-review.md` | 专家教程审查 | 高级教程的技术深度评估 |
| `prd.md` | PRD 审查 | 产品需求文档审查 |

## V2 统一审查流程

`unified-review.md` 实现三阶段审查流程：

### Phase 1: 一致性审查（Compliance Review）
- 检查代码是否符合设计文档要求
- 验证实现是否遵循开发计划
- 输出：`compliance_score` (0-10)

### Phase 2: UI 一致性审查（UI Compliance Review）
- 检查 UI 实现是否符合设计规范
- 验证组件、样式、交互的一致性
- 输出：`ui_compliance_score` (0-10)
- 注：仅当代码涉及 UI 时执行

### Phase 3: 探索性审查（Exploratory Review）
- 代码质量、可维护性、性能分析
- 潜在 bug 和安全风险识别
- 最佳实践和改进建议
- 输出：`quality_score` (0-10)

## 问题等级定义

| 等级 | 含义 | 处理要求 |
|------|------|---------|
| **P0** | 阻断性问题 | 必须立即修复，阻止合并 |
| **P1** | 重要问题 | 应该修复，可能影响功能 |
| **P2** | 建议改进 | 可选优化，提升代码质量 |

## 固定文档路径

V2 版本支持固定文档路径注入，Reviewer 会自动参考：

```
docs/design/ui-spec.md    # UI 设计规范
docs/design/              # 设计文档目录
docs/plans/               # 开发计划目录
```

## 自定义模板

如需创建自定义模板，请遵循以下格式：

```markdown
# 模板标题

## 审查重点
- 重点 1
- 重点 2

## 输出格式
请按以下格式输出审查结果：

### 发现的问题
...

### 评分
- score_name: X/10
```
