# ApisixRoute/v2 字段速查

来源（Ingress Controller 1.8.0）：https://apisix.apache.org/zh/docs/ingress-controller/1.8.0/references/apisix_route_v2/
提示：生产环境使用 1.8.0，默认以此为准；如用户明确版本不同，再对照对应版本文档确认字段。

## spec.http[]

- `name`（必填）：路由名称
- `priority`：数值越大优先级越高
- `timeout`：`connect`/`send`/`read`，格式如 `72h3m0.5s`
- `match`：
  - `paths`：URI 列表
  - `hosts`：Host 列表
  - `methods`：HTTP 方法列表
  - `remoteAddrs`：CIDR 列表
  - `exprs`：表达式匹配（见下文）
- `websocket`：`true` 启用 WebSocket
- `plugin_config_name`：引用已有 PluginConfig
- `plugin_config_namespace`：PluginConfig 所在命名空间
- `backends[]`：
  - `serviceName`：与 ApisixRoute 同 namespace
  - `servicePort`：端口号或 Service 端口名
  - `resolveGranularity`：`endpoint`（默认）或 `service`
  - `weight`：多后端时按权重分流，默认 `100`
  - `subset`：依赖 ApisixUpstream 预定义
- `plugins[]`：
  - `name` / `enable` / `config`
- `authentication`：
  - `enable`
  - `type`：`basicAuth` 或 `keyAuth`
  - `keyAuth.header`
- `upstreams[]`：关联 `ApisixUpstream` 资源（`name` / `weight`）

## match.exprs[]

- `subject.scope`：`Header` / `Query` / `Cookie` / `Path`
- `subject.name`：当 scope 为 `Path` 可为空
- `op`：见下方操作符
- `value` 或 `set`（`In`/`NotIn` 使用 `set`）

## 表达式操作符

- `Equal` / `NotEqual`
- `GreaterThan` / `LessThan`
- `In` / `NotIn`
- `RegexMatch` / `RegexNotMatch`
- `RegexMatchCaseInsensitive` / `RegexNotMatchCaseInsensitive`

## service resolution granularity

- `endpoint`：上游节点为 Pod IP（默认）
- `service`：上游节点为 Service ClusterIP（由 kube-proxy 负载）

## spec.stream[]

- `protocol`（必填）：`TCP` / `UDP`
- `name`（必填）
- `match.ingressPort`（必填）
- `backend` 已标记 deprecated；如需 Stream 路由请先确认现网实践
