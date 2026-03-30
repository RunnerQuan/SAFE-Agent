# APISIX Route 输入清单

## 基本信息

- 询问目标环境（dev/test/prod）与集群访问方式
- 询问 Ingress Controller 版本（生产为 1.8.0）
- 询问 `metadata.namespace`
- 询问是否新建或追加已有 ApisixRoute（如追加，先索取当前 YAML）
- 询问 `metadata.name` 的命名偏好（如按域名/系统/服务）

## 每条路由信息（spec.http[]）

- 询问路由 `name`
- 询问 `match.hosts`（可多值）
- 询问 `match.paths`（是否包含通配，如 `/api/*` 或 `/`）
- 询问是否限制 `match.methods`（GET/POST/...）
- 询问是否限制 `match.remoteAddrs`（CIDR 白名单）
- 询问是否需要 `match.exprs`（Header/Query/Cookie/Path 表达式）
- 询问后端服务 `backends.serviceName` 与 `backends.servicePort`
- 询问是否需要权重或灰度：`backends.weight`
- 询问是否需要 `backends.resolveGranularity`（endpoint/service）
- 询问是否需要 `backends.subset`（依赖 ApisixUpstream）
- 询问是否需要 `plugin_config_name` 或 `plugins`（例如鉴权、审计、CORS、重写）
- 询问 `plugin_config_namespace`（当 PluginConfig 不在同 namespace）
- 询问是否需要 `priority`（多条路由 URI 重叠时）
- 询问是否需要 `timeout`（connect/send/read）
- 询问是否开启 `websocket`
- 询问是否需要 `authentication`（basicAuth/keyAuth）
- 询问是否使用 `upstreams`（关联 ApisixUpstream）
- 如有特殊要求，询问自定义插件配置或其他额外字段

## 期望行为

- 询问哪些路径需要鉴权、哪些为公开路径
- 询问是否需要路径重写或前缀裁剪

## Stream 路由（spec.stream[]）

- 询问是否需要 TCP/UDP 转发
- 询问 `stream[].protocol`（TCP/UDP）与 `stream[].match.ingressPort`
- 询问后端服务信息（如需使用 stream backend）
