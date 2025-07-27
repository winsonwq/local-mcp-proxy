# MCP HTTP 代理使用示例

## 概述

MCP HTTP 代理可以将任何transport类型（stdio、http、websocket）的MCP服务器工具调用转换为HTTP API，提供统一的接口。

## 基本使用

### 1. 启动代理服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 2. 查看服务器状态

```bash
# 获取所有服务器状态
curl http://localhost:3000/api/servers

# 获取特定服务器状态
curl http://localhost:3000/api/servers/filesystem

# 获取性能指标
curl http://localhost:3000/api/metrics
```

### 3. 查看可用工具

```bash
# 获取所有工具
curl http://localhost:3000/api/tools

# 获取特定服务器的工具
curl http://localhost:3000/api/servers/filesystem/tools
```

## 工具调用示例

### 调用 stdio 类型的工具

```bash
# 调用文件系统服务
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "read_file",
    "arguments": {
      "path": "test.txt"
    },
    "requestId": "req_001"
  }'
```

### 调用 HTTP 类型的工具

```bash
# 调用 HTTP 服务
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "http-service",
    "toolName": "http_get",
    "arguments": {
      "url": "https://api.github.com/users/octocat"
    },
    "requestId": "req_002"
  }'
```

### 调用 WebSocket 类型的工具

```bash
# 调用 WebSocket 服务
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "websocket-service",
    "toolName": "send_message",
    "arguments": {
      "message": "Hello from HTTP proxy!",
      "channel": "general"
    },
    "requestId": "req_003"
  }'
```

### 调用内置服务

```bash
# 调用内置文件系统服务
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "list_dir",
    "arguments": {
      "relative_workspace_path": "."
    },
    "requestId": "req_004"
  }'
```

## 高级功能

### 1. 批量调用工具

```bash
curl -X POST http://localhost:3000/api/batch-call \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "serverId": "filesystem",
        "toolName": "read_file",
        "arguments": {"path": "file1.txt"},
        "requestId": "batch_001_1"
      },
      {
        "serverId": "http-service",
        "toolName": "http_get",
        "arguments": {"url": "https://httpbin.org/get"},
        "requestId": "batch_001_2"
      },
      {
        "serverId": "websocket-service",
        "toolName": "get_status",
        "arguments": {},
        "requestId": "batch_001_3"
      }
    ]
  }'
```

### 2. 带超时和重试的调用

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "remote-api",
    "toolName": "fetch_data",
    "arguments": {
      "endpoint": "/api/data",
      "params": {"limit": 100}
    },
    "requestId": "req_005",
    "timeout": 30000,
    "retryAttempts": 3
  }'
```

### 3. 直接调用特定工具

```bash
# 直接调用特定服务器的特定工具
curl -X POST http://localhost:3000/api/servers/filesystem/tools/read_file \
  -H "Content-Type: application/json" \
  -d '{
    "path": "config.json",
    "requestId": "req_006"
  }'
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    "content": "文件内容或工具返回的数据"
  },
  "requestId": "req_001",
  "serverId": "filesystem",
  "toolName": "read_file",
  "executionTime": 45,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "文件不存在",
  "requestId": "req_001",
  "serverId": "filesystem",
  "toolName": "read_file",
  "executionTime": 12,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 批量调用响应

```json
{
  "batchId": "batch_1705312200000",
  "totalRequests": 3,
  "successfulRequests": 2,
  "failedRequests": 1,
  "totalExecutionTime": 150,
  "averageExecutionTime": 50,
  "results": [
    {
      "success": true,
      "data": {...},
      "requestId": "batch_001_1"
    },
    {
      "success": true,
      "data": {...},
      "requestId": "batch_001_2"
    },
    {
      "success": false,
      "error": "连接超时",
      "requestId": "batch_001_3"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 监控和调试

### 1. 健康检查

```bash
curl http://localhost:3000/api/health
```

### 2. 性能指标

```bash
curl http://localhost:3000/api/metrics
```

### 3. 刷新服务器状态

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/refresh
```

## 配置示例

### stdio 服务器配置

```yaml
filesystem:
  name: "文件系统服务"
  description: "本地文件系统操作"
  type: "stdio"
  enabled: true
  transport:
    type: "stdio"
    command: "node"
    args: ["../examples/mcp-server.js"]
    workingDir: "./"
    env:
      NODE_ENV: "development"
    retryAttempts: 3
    retryDelay: 1000
```

### HTTP 服务器配置

```yaml
http-service:
  name: "HTTP 服务"
  description: "HTTP 请求服务"
  type: "http"
  enabled: true
  transport:
    type: "http"
    url: "http://localhost:8080"
    headers:
      Authorization: "Bearer your-token"
    timeout: 10000
    retryAttempts: 2
    retryDelay: 500
```

### WebSocket 服务器配置

```yaml
websocket-service:
  name: "WebSocket 服务"
  description: "WebSocket 连接服务"
  type: "websocket"
  enabled: true
  transport:
    type: "websocket"
    wsUrl: "ws://localhost:8081"
    protocols: ["mcp"]
    timeout: 15000
    retryAttempts: 3
    retryDelay: 2000
```

## 最佳实践

1. **请求ID**: 始终为每个请求提供唯一的 `requestId`，便于追踪和调试
2. **错误处理**: 检查响应的 `success` 字段，处理可能的错误
3. **超时设置**: 为长时间运行的操作设置适当的超时时间
4. **批量调用**: 使用批量调用API来提高效率，但注意限制（最多10个请求）
5. **监控**: 定期检查 `/api/metrics` 来监控系统性能
6. **重试**: 为不稳定的连接配置适当的重试策略

## 故障排除

### 常见问题

1. **服务器连接失败**: 检查配置文件中的连接参数
2. **工具调用超时**: 增加 `timeout` 参数或检查网络连接
3. **权限错误**: 检查 stdio 服务器的执行权限
4. **配置错误**: 验证 YAML 配置文件的语法

### 调试技巧

1. 查看服务器日志获取详细错误信息
2. 使用 `/api/servers` 检查服务器状态
3. 使用 `/api/metrics` 监控性能指标
4. 检查网络连接和防火墙设置 