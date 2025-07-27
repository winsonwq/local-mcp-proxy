import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { ConfigManager } from './config/ConfigManager'
import { MCPServerManager } from './servers/MCPServerManager'
import { createRoutes } from './routes'

class MCPServer {
  private app: express.Application
  private configManager: ConfigManager
  private serverManager: MCPServerManager

  constructor() {
    this.app = express()
    this.configManager = new ConfigManager()
    this.serverManager = new MCPServerManager(this.configManager.getServers())

    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet())

    // CORS configuration
    const proxyConfig = this.configManager.getProxyConfig()
    if (proxyConfig.cors) {
      this.app.use(cors({
        origin: true,
        credentials: true
      }))
    }

    // Logging middleware
    if (proxyConfig.enableLogging) {
      this.app.use(morgan('combined'))
    }

    // JSON parsing
    this.app.use(express.json({ limit: proxyConfig.maxRequestSize }))
    this.app.use(express.urlencoded({ extended: true }))
  }

  private setupRoutes(): void {
    const routes = createRoutes(this.serverManager)
    this.app.use('/api', routes)

    // Root path redirect to API info
    this.app.get('/', (req, res) => {
      res.redirect('/api/info')
    })

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: '/api/info'
      })
    })

    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      })
    })
  }

  public start(): void {
    const proxyConfig = this.configManager.getProxyConfig()
    const { port, host } = proxyConfig

    this.app.listen(port, host, () => {
      console.log(`🚀 MCP HTTP Proxy Server started successfully!`)
      console.log(`📍 Address: http://${host}:${port}`)
      console.log(`📋 API Documentation: http://${host}:${port}/api/info`)
      console.log(`🏥 Health Check: http://${host}:${port}/api/health`)
      console.log(`🔧 Server Status: http://${host}:${port}/api/servers`)
      console.log(`🛠️  Available Tools: http://${host}:${port}/api/tools`)

      console.log('\n📝 Usage Examples:')
      console.log(`  # Call configured MCP servers`)
      console.log(`  curl -X POST http://${host}:${port}/api/call \\`)
      console.log(`    -H "Content-Type: application/json" \\`)
      console.log(`    -d '{"serverId": "filesystem", "toolName": "list_directory", "arguments": {"path": "."}}'`)

      console.log(`  # View server status`)
      console.log(`  curl http://${host}:${port}/api/servers`)

      console.log(`  # View available tools`)
      console.log(`  curl http://${host}:${port}/api/tools`)

      console.log('\n🔗 MCP Protocol Support (per-server):')
      console.log(`  # Initialize MCP connection for filesystem server`)
      console.log(`  curl -X POST http://${host}:${port}/api/servers/filesystem/mcp \\`)
      console.log(`    -H "Content-Type: application/json" \\`)
      console.log(`    -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}'`)

      console.log(`  # List tools for filesystem server (MCP protocol)`)
      console.log(`  curl -X POST http://${host}:${port}/api/servers/filesystem/mcp \\`)
      console.log(`    -H "Content-Type: application/json" \\`)
      console.log(`    -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}'`)

      console.log(`  # Call tool on filesystem server (MCP protocol)`)
      console.log(`  curl -X POST http://${host}:${port}/api/servers/filesystem/mcp \\`)
      console.log(`    -H "Content-Type: application/json" \\`)
      console.log(`    -d '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "list_directory", "arguments": {"path": "."}}}'`)

      console.log('\n⚙️  Configuration for other MCP clients:')
      console.log(`  # Add this to your MCP client config to use filesystem server via proxy:`)
      console.log(`  {`)
      console.log(`    "name": "Filesystem Server",`)
      console.log(`    "description": "Filesystem server via HTTP proxy",`)
      console.log(`    "type": "http",`)
      console.log(`    "transport": {`)
      console.log(`      "type": "http",`)
      console.log(`      "url": "http://${host}:${port}/api/servers/filesystem/mcp"`)
      console.log(`    }`)
      console.log(`  }`)
    })
  }
}

const server = new MCPServer()
server.start()
