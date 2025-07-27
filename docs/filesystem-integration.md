# MCP Filesystem 服务器集成指南

本指南介绍如何在 MCP HTTP 代理中集成官方的 MCP Filesystem 服务器。

## 📦 安装官方 Filesystem 服务器

官方 MCP Filesystem 服务器已经通过 npx 提供，无需额外安装：

```bash
# 测试运行（可选）
npx -y @modelcontextprotocol/server-filesystem /path/to/allowed/directory
```

## ⚙️ 配置

在 `config/mcp-servers.json` 中添加以下配置：

```json
{
  "servers": {
    "filesystem": {
      "name": "MCP Filesystem Server",
      "description": "官方 MCP 文件系统服务器",
      "type": "stdio",
      "enabled": true,
      "transport": {
        "type": "stdio",
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/Users/username/Desktop",
          "/path/to/other/allowed/dir"
        ],
        "workingDir": ".",
        "env": {
          "NODE_ENV": "production"
        },
        "retryAttempts": 3,
        "retryDelay": 1000
      }
    }
  }
}
```

## 🔧 可用工具

官方 Filesystem 服务器提供以下工具：

### 1. `list_directory` - 列出目录内容
```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "list_directory",
    "arguments": {
      "path": "."
    },
    "requestId": "list_001"
  }'
```

### 2. `read_file` - 读取文件内容
```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "read_file",
    "arguments": {
      "path": "README.md",
      "head": 10
    },
    "requestId": "read_001"
  }'
```

### 3. `search_files` - 搜索文件
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
    "requestId": "search_001"
  }'
```

### 4. `write_file` - 写入文件
```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "write_file",
    "arguments": {
      "path": "test.txt",
      "content": "Hello, World!"
    },
    "requestId": "write_001"
  }'
```

### 5. `create_directory` - 创建目录
```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "create_directory",
    "arguments": {
      "path": "new-directory"
    },
    "requestId": "mkdir_001"
  }'
```

### 6. `list_allowed_directories` - 获取允许的目录
```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "list_allowed_directories",
    "arguments": {},
    "requestId": "allowed_001"
  }'
```

## 🧪 测试集成

运行专门的测试脚本：

```bash
# 测试 filesystem 服务器集成
npm run test:filesystem
```

或者手动测试：

```bash
# 1. 启动 MCP HTTP 代理
npm start

# 2. 检查服务器状态
curl http://localhost:3000/api/servers/filesystem

# 3. 测试列出目录
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "list_directory",
    "arguments": {"path": "."},
    "requestId": "test_001"
  }'
```

## 🔒 安全配置

### 目录权限控制

Filesystem 服务器只允许访问配置中指定的目录。确保只添加需要访问的目录：

```yaml
args: [
  "-y",
  "@modelcontextprotocol/server-filesystem",
  "/Users/username/projects",     # 项目目录
  "/Users/username/documents",    # 文档目录
  # 不要添加系统关键目录如 /etc, /usr 等
]
```

### 环境变量

可以设置环境变量来控制服务器行为：

```yaml
transport:
  type: "stdio"
  command: "npx"
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
  env:
    NODE_ENV: "production"
    # 可以添加其他环境变量
```

## 🚨 故障排除

### 1. 服务器连接失败

检查配置中的路径是否正确：

```bash
# 测试 npx 命令是否可用
npx -y @modelcontextprotocol/server-filesystem /test/path
```

### 2. 权限错误

确保配置的目录存在且有读取权限：

```bash
# 检查目录权限
ls -la /path/to/allowed/directory
```

### 3. 工具调用失败

检查工具参数格式是否正确，参考官方文档：
https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

## 📚 更多信息

- [官方 MCP Filesystem 服务器](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- [MCP 协议文档](https://modelcontextprotocol.io/)
- [工具调用格式](https://modelcontextprotocol.io/specification.html#tool-calls) 