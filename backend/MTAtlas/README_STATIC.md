# MTAtlas Static-Pure

这个文档说明 `MTAtlas` 的纯静态模式 `static-pure` 怎么运行。


## 输入格式

输入必须是一个 JSON 文件，内容是工具列表。每个工具必须包含这 4 个字段：

```json
[
  {
    "func_signature": "get_email_content",
    "description": "Get the full content of a specific email by its ID.",
    "MCP": "Claude Post",
    "code": "def get_email_content(...): ..."
  }
]
```

字段说明：

- `func_signature`: 工具函数名或函数签名
- `description`: 工具描述
- `MCP`: 这个工具所属的 MCP 或模块
- `code`: 工具源码

仓库里已经放了一个示例输入：

[demo_tools.json](MTAtlas/inputs/static_pure/demo_tools.json)

## 运行方式

先进入仓库根目录：

```bash
cd MTAtlas
```

然后运行：

```bash
PYTHONUTF8=1 python3 -S -m mtatlas --mode static-pure --input inputs/static_pure/demo_tools.json --framework demo_static_pure --artifact-root artifacts
```

如果你要分析自己的工具文件，把 `--input` 替换成你自己的 JSON 路径即可：

```bash
PYTHONUTF8=1 python3 -S -m mtatlas --mode static-pure --input path/to/tools.json --framework my_app --artifact-root artifacts
```

## 参数说明

- `--mode static-pure`: 运行纯静态模式
- `--input`: 输入的工具 metadata JSON 文件
- `--framework`: 结果输出目录名
- `--artifact-root`: 输出根目录

## 输出目录

如果你使用：

```bash
--artifact-root artifacts --framework demo_static_pure
```

那么输出目录就是：

[artifacts/demo_static_pure/static_pure](MTAtlas/artifacts/demo_static_pure/static_pure)

## 主要输出文件

- `normalized_tools.json`: 标准化后的工具信息
- `sink_tools.json`: 识别出的 sink tools
- `dependency_edges.json`: 静态依赖边
- `candidate_chains.json`: 提取出的链条
- `filtered_candidate_chains.json`: 过滤后的链条
- `source_risk_report.json`: `user-source` / `environment-source` 风险分析
- `summary.json`: 统计摘要
- `report.md`: 可读报告

## 先看哪个文件

如果你想直接看链条，先看：

[candidate_chains.json](MTAtlas/artifacts/demo_static_pure/static_pure/candidate_chains.json)

如果你想直接看 `user-source` 和 `environment-source`，看：

[source_risk_report.json](MTAtlas/artifacts/demo_static_pure/static_pure/source_risk_report.json)

如果你只想先看概览，打开：

[summary.json](MTAtlas/artifacts/demo_static_pure/static_pure/summary.json)
