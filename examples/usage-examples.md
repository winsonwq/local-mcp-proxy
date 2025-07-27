# MCP HTTP 代理使用示例

本文档提供 MCP HTTP 代理的实际使用示例。

## 🚀 快速开始

### 1. 启动服务器

```bash
npm start
```

### 2. 检查服务器状态

```bash
curl http://localhost:3000/api/health
```

### 3. 查看可用工具

```bash
curl http://localhost:3000/api/tools
```

## 📁 Filesystem 服务器示例

### 列出目录内容

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "list_directory",
    "arguments": {
      "path": "."
    },
    "requestId": "example_001"
  }'
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "type": "text",
      "text": "[FILE] README.md\n[DIR] config\n[DIR] docs\n[DIR] examples\n[DIR] node_modules\n[FILE] package-lock.json\n[FILE] package.json\n[DIR] src\n[FILE] test-filesystem.js\n[FILE] test-proxy.js\n[FILE] test.txt\n[FILE] tsconfig.json"
    }
  ],
  "requestId": "example_001",
  "serverId": "filesystem",
  "toolName": "list_directory",
  "executionTime": 8,
  "timestamp": "2025-07-27T05:54:24.115Z"
}
```

### 读取文件内容

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "read_file",
    "arguments": {
      "path": "README.md",
      "head": 5
    },
    "requestId": "example_002"
  }'
```

### 搜索文件

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "search_files",
    "arguments": {
      "path": ".",
      "pattern": "README"
    },
    "requestId": "example_003"
  }'
```

### 创建目录

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "create_directory",
    "arguments": {
      "path": "test-directory"
    },
    "requestId": "example_004"
  }'
```

### 写入文件

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "write_file",
    "arguments": {
      "path": "test.txt",
      "content": "Hello, MCP HTTP Proxy!"
    },
    "requestId": "example_005"
  }'
```

## 🔄 批量调用示例

### 批量文件操作

```bash
curl -X POST http://localhost:3000/api/batch-call \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "serverId": "filesystem",
        "toolName": "list_directory",
        "arguments": {"path": "."},
        "requestId": "batch_001_1"
      },
      {
        "serverId": "filesystem",
        "toolName": "read_file",
        "arguments": {"path": "README.md", "head": 3},
        "requestId": "batch_001_2"
      },
      {
        "serverId": "filesystem",
        "toolName": "list_allowed_directories",
        "arguments": {},
        "requestId": "batch_001_3"
      }
    ]
  }'
```

**响应示例:**
```json
{
  "batchId": "batch_1753595741679",
  "totalRequests": 3,
  "successfulRequests": 3,
  "failedRequests": 0,
  "totalExecutionTime": 15,
  "averageExecutionTime": 5,
  "results": [
    {
      "success": true,
      "data": [...],
      "requestId": "batch_001_1",
      "serverId": "filesystem",
      "toolName": "list_directory",
      "executionTime": 7,
      "timestamp": "2025-07-27T05:55:41.675Z"
    },
    ...
  ],
  "timestamp": "2025-07-27T05:55:41.690Z"
}
```

## 📊 监控和调试

### 获取性能指标

```bash
curl http://localhost:3000/api/metrics
```

**响应示例:**
```json
{
  "totalRequests": 9,
  "successfulRequests": 9,
  "failedRequests": 0,
  "averageResponseTime": 29.78,
  "serverStats": {
    "filesystem": {
      "requests": 9,
      "errors": 0,
      "averageTime": 29.78
    }
  },
  "timestamp": "2025-07-27T05:55:41.690Z"
}
```

### 获取服务器状态

```bash
curl http://localhost:3000/api/servers
```

### 获取特定服务器信息

```bash
curl http://localhost:3000/api/servers/filesystem
```

## 🧪 测试

### 运行基础功能测试

```bash
npm test
```

### 运行 Filesystem 服务器测试

```bash
npm run test:filesystem
```

## 🔧 错误处理

### 工具不存在

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "non_existent_tool",
    "arguments": {},
    "requestId": "error_001"
  }'
```

**响应示例:**
```json
{
  "success": false,
  "error": "Unknown tool: non_existent_tool",
  "requestId": "error_001",
  "serverId": "filesystem",
  "toolName": "non_existent_tool",
  "executionTime": 2,
  "timestamp": "2025-07-27T05:56:00.000Z"
}
```

### 服务器离线

如果服务器离线，会返回：

```json
{
  "success": false,
  "error": "Server filesystem is not available",
  "requestId": "error_002",
  "serverId": "filesystem",
  "toolName": "list_directory"
}
```

## 💡 最佳实践

1. **使用有意义的 requestId**: 便于追踪和调试
2. **批量调用**: 对于多个相关操作，使用批量调用提高效率
3. **错误处理**: 始终检查响应的 `success` 字段
4. **监控**: 定期检查性能指标和服务器状态
5. **超时设置**: 对于长时间运行的操作，设置适当的超时时间

## 🔗 相关文档

- [Filesystem 集成指南](../docs/filesystem-integration.md)
- [README](../README.md)
- [配置说明](../config/mcp-servers.yaml) 