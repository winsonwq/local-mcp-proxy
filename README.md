# MCP HTTP Proxy Server

一个用于 Model Context Protocol (MCP) 服务器的 HTTP 代理，支持多种传输协议并提供统一的 API 接口。

## 功能特性

- 🔄 **多协议支持**: 支持 stdio、HTTP、WebSocket 传输协议
- 🌐 **HTTP API**: 提供 RESTful API 接口
- 🔗 **MCP 协议支持**: 每个服务器都有独立的 MCP 协议端点，可作为 MCP 服务器被其他客户端连接
- 📊 **监控指标**: 实时性能监控和统计
- 🔧 **配置管理**: 灵活的服务器配置
- 🚀 **批量操作**: 支持批量工具调用
- 🛡️ **安全**: CORS 支持、请求限制、超时控制

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置服务器

编辑 `config/mcp-servers.json` 文件：

```json
{
  "proxy": {
    "port": 3000,
    "host": "0.0.0.0",
    "cors": true,
    "rateLimit": 1000,
    "requestTimeout": 30000,
    "maxRequestSize": "10mb",
    "enableMetrics": true,
    "enableLogging": true
  },
  "servers": {
    "filesystem": {
      "name": "MCP Filesystem Server",
      "description": "Official MCP Filesystem Server",
      "type": "stdio",
      "enabled": true,
      "transport": {
        "type": "stdio",
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/path/to/directory1",
          "/path/to/directory2"
        ],
        "workingDir": ".",
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

### 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 使用

### 常规 HTTP API

#### 调用工具

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "list_directory",
    "arguments": {"path": "."}
  }'
```

#### 查看服务器状态

```bash
curl http://localhost:3000/api/servers
```

#### 查看可用工具

```bash
curl http://localhost:3000/api/tools
```

### MCP 协议支持

每个服务器都有独立的 MCP 协议端点，可以被其他 MCP 客户端连接。

#### 初始化连接

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/mcp/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }'
```

#### 列出工具

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/mcp/tools/list \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

#### 调用工具

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "list_directory",
      "arguments": {"path": "."}
    }
  }'
```

## 配置为 MCP 服务器

你可以将代理服务器中的任何服务器配置为其他 MCP 客户端的服务器：

```json
{
  "mcpServers": {
    "filesystem-via-proxy": {
      "name": "Filesystem Server",
      "description": "Filesystem server via HTTP proxy",
      "type": "http",
      "transport": {
        "type": "http",
        "url": "http://localhost:3000/api/servers/filesystem/mcp",
        "headers": {
          "Content-Type": "application/json"
        },
        "timeout": 30000
      }
    }
  }
}
```

### 服务器端点格式

每个服务器的 MCP 协议端点格式为：`/api/servers/{serverId}/mcp`

例如：
- `http://localhost:3000/api/servers/filesystem/mcp`
- `http://localhost:3000/api/servers/notion/mcp`
- `http://localhost:3000/api/servers/github/mcp`

## API 端点

### 常规端点

- `GET /api/health` - 健康检查
- `GET /api/metrics` - 性能指标
- `GET /api/servers` - 服务器状态
- `GET /api/servers/:id` - 特定服务器状态
- `POST /api/servers/:id/refresh` - 刷新服务器状态
- `GET /api/tools` - 所有可用工具
- `GET /api/servers/:id/tools` - 特定服务器的工具
- `POST /api/call` - 调用工具
- `POST /api/servers/:id/tools/:toolName` - 调用特定服务器的特定工具
- `POST /api/batch-call` - 批量调用工具
- `GET /api/info` - API 信息

### MCP 协议端点（每个服务器）

- `POST /api/servers/:id/mcp/initialize` - MCP 初始化
- `POST /api/servers/:id/mcp/tools/list` - MCP 工具列表
- `POST /api/servers/:id/mcp/tools/call` - MCP 工具调用
- `POST /api/servers/:id/mcp` - 通用 MCP 端点

## 测试

运行测试脚本：

```bash
node test-mcp-protocol.js
```

## 开发

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

## 配置说明

### 代理配置

- `port`: 服务器端口
- `host`: 服务器主机
- `cors`: 是否启用 CORS
- `rateLimit`: 请求限制
- `requestTimeout`: 请求超时时间
- `maxRequestSize`: 最大请求大小
- `enableMetrics`: 是否启用指标
- `enableLogging`: 是否启用日志

### 服务器配置

- `name`: 服务器名称
- `description`: 服务器描述
- `type`: 服务器类型 (stdio/http/websocket)
- `enabled`: 是否启用
- `transport`: 传输配置

### 传输配置

#### stdio 传输

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem"],
  "workingDir": ".",
  "env": {"NODE_ENV": "production"}
}
```

#### HTTP 传输

```json
{
  "type": "http",
  "url": "http://localhost:8080",
  "headers": {"Authorization": "Bearer token"},
  "timeout": 30000
}
```

#### WebSocket 传输

```json
{
  "type": "websocket",
  "wsUrl": "ws://localhost:8080",
  "protocols": ["mcp"]
}
```

## 许可证

MIT 