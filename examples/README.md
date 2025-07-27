# Examples 目录

这个目录用于存放 MCP 服务器的示例代码。

## 当前状态

目前这个目录是空的，因为项目专注于代理外部 MCP 服务器，而不是提供内置的服务器实现。

## 添加示例

如果您想要添加自己的 MCP 服务器示例，可以：

1. 创建新的服务器文件
2. 在 `config/mcp-servers.yaml` 中配置服务器
3. 通过 HTTP API 调用服务器工具

## 官方服务器

项目已预配置官方 MCP Filesystem 服务器，请参考：
- `docs/filesystem-integration.md` - 详细集成指南
- `config/mcp-servers.yaml` - 配置文件
- `test-filesystem.js` - 测试脚本 