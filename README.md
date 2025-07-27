# MCP HTTP Proxy Server

An HTTP proxy for Model Context Protocol (MCP) servers that supports multiple transport protocols and provides a unified API interface.

[English](README.md) | [中文](README.zh-CN.md)

## Features

- 🔄 **Multi-Protocol Support**: Supports stdio, HTTP, and WebSocket transport protocols
- 🌐 **HTTP API**: Provides RESTful API interface
- 🔗 **MCP Protocol Support**: Each server has independent MCP protocol endpoints that can be connected by other MCP clients
- 📊 **Monitoring Metrics**: Real-time performance monitoring and statistics
- 🔧 **Configuration Management**: Flexible server configuration
- 🚀 **Batch Operations**: Supports batch tool calls
- 🛡️ **Security**: CORS support, request limiting, timeout control

## Quick Start

### Install Dependencies

```bash
npm install
```

### Configure Servers

Edit the `config/mcp-servers.json` file:

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

### Start Server

```bash
npm start
```

The server will start at `http://localhost:3000`.

## API Usage

### Regular HTTP API

#### Call Tools

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "filesystem",
    "toolName": "list_directory",
    "arguments": {"path": "."}
  }'
```

#### View Server Status

```bash
curl http://localhost:3000/api/servers
```

#### View Available Tools

```bash
curl http://localhost:3000/api/tools
```

### MCP Protocol Support

Each server has independent MCP protocol endpoints that can be connected by other MCP clients.

#### Initialize Connection

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }'
```

#### List Tools

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

#### Call Tools

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/mcp \
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

## Configure as MCP Server

You can configure any server in the proxy as a server for other MCP clients:

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

### Server Endpoint Format

The MCP protocol endpoint format for each server is: `/api/servers/{serverId}/mcp`

Examples:
- `http://localhost:3000/api/servers/filesystem/mcp`
- `http://localhost:3000/api/servers/notion/mcp`
- `http://localhost:3000/api/servers/github/mcp`

## API Endpoints

### Regular Endpoints

- `GET /api/health` - Health check
- `GET /api/metrics` - Performance metrics
- `GET /api/servers` - Server status
- `GET /api/servers/:id` - Specific server status
- `POST /api/servers/:id/refresh` - Refresh server status
- `GET /api/tools` - All available tools
- `GET /api/servers/:id/tools` - Tools for specific server
- `POST /api/call` - Call tools
- `POST /api/servers/:id/tools/:toolName` - Call specific tool on specific server
- `POST /api/batch-call` - Batch call tools
- `GET /api/info` - API information

### MCP Protocol Endpoints (per server)

- `POST /api/servers/:id/mcp` - Unified MCP protocol endpoint (supports initialize, tools/list, tools/call)

## Testing

Run the test script:

```bash
node test-mcp-protocol.js
```

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Configuration

### Proxy Configuration

- `port`: Server port
- `host`: Server host
- `cors`: Enable CORS
- `rateLimit`: Request rate limit
- `requestTimeout`: Request timeout
- `maxRequestSize`: Maximum request size
- `enableMetrics`: Enable metrics
- `enableLogging`: Enable logging

### Server Configuration

- `name`: Server name
- `description`: Server description
- `type`: Server type (stdio/http/websocket)
- `enabled`: Enable/disable server
- `transport`: Transport configuration

### Transport Configuration

#### stdio Transport

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem"],
  "workingDir": ".",
  "env": {"NODE_ENV": "production"}
}
```

#### HTTP Transport

```json
{
  "type": "http",
  "url": "http://localhost:8080",
  "headers": {"Authorization": "Bearer token"},
  "timeout": 30000
}
```

#### WebSocket Transport

```json
{
  "type": "websocket",
  "wsUrl": "ws://localhost:8080",
  "protocols": ["mcp"]
}
```

## Use Cases

1. **Unified Management**: Manage multiple MCP servers through a single proxy
2. **Protocol Conversion**: Convert stdio/WebSocket servers to HTTP access
3. **Load Balancing**: Distribute requests across multiple proxy instances
4. **Monitoring Integration**: Unified monitoring and logging
5. **Security Control**: Unified authentication and authorization

## License

MIT 