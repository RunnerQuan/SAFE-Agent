---
name: apisix-route-creator
description: Create or update APISIX ApisixRoute (v2) YAML for Gold Card services. Use when asked to add or modify gateway routes, map hosts/paths to Kubernetes services, configure APISIX route plugin configs (plugin_config_name/plugins), or when 需要创建/调整 APISIX 路由与网关配置（含 portal/iam 相关服务）。
---

# APISIX Route Creator

## 快速流程

- 打开 `references/example.yaml` 作为结构参考
- 使用 `references/inputs.md` 的提问清单收集信息
- 生成 ApisixRoute YAML，并对缺失信息标注 TODO 后回问用户

## 生成步骤

1. 确认环境与范围：目标环境、namespace、Ingress Controller 版本（生产为 1.8.0）、是否新建还是追加已有 ApisixRoute（如追加，先索取现有 YAML）
2. 设置 metadata：填写 `metadata.name` 与 `metadata.namespace`
3. 为每条路由收集并填写 `spec.http[]`：
   - `name`
   - `match.hosts` 与 `match.paths`
   - 可选：`match.methods`、`match.remoteAddrs`、`match.exprs`
   - `backends.serviceName` 与 `backends.servicePort`
   - 可选：`backends.weight`、`backends.resolveGranularity`、`backends.subset`
   - `plugin_config_name` 或 `plugins`（仅在用户提供时添加）
   - 可选：`plugin_config_namespace`、`priority`、`timeout`、`websocket`
   - 可选：`authentication`、`upstreams`
4. 当同一 host 需要不同插件或不同上游时，拆分为多条路由
5. 保持路径规则从具体到泛化，避免互相覆盖
6. 需要 TCP/UDP 时改用 `spec.stream[]`，先确认协议与 ingressPort

## 字段参考

- 规范字段说明：`references/apisix-route-v2-fields.md`

## 输出要求

- 输出完整的 ApisixRoute YAML，结构对齐示例
- 多个资源时用 `---` 分隔
- 不猜测插件名称、服务名或端口；信息缺失时回问

## 校验建议

- 用户具备集群权限时，执行：
  - `kubectl apply --dry-run=client -f <file>`
  - `kubectl get apisixroute -n <namespace> <name>`
  - `kubectl describe apisixroute -n <namespace> <name>`

## 参考

- 结构示例：`references/example.yaml`
- 提问清单：`references/inputs.md`
- 字段说明：`references/apisix-route-v2-fields.md`
