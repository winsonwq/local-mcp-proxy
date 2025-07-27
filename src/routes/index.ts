import { Router } from 'express';
import { MCPServerManager } from '../servers/MCPServerManager';
import { MCPCallRequest, Metrics } from '../types';

export function createRoutes(
  serverManager: MCPServerManager
): Router {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Get performance metrics
  router.get('/metrics', (req, res) => {
    const metrics = serverManager.getMetrics();
    res.json(metrics);
  });

  // Get all server status
  router.get('/servers', (req, res) => {
    const servers = serverManager.getAllServerStatus();
    res.json(servers);
  });

  // Get specific server status
  router.get('/servers/:id', (req, res) => {
    const server = serverManager.getServerStatus(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    res.json(server);
  });

  // Refresh server status
  router.post('/servers/:id/refresh', async (req, res) => {
    try {
      await serverManager.refreshServerStatus(req.params.id);
      res.json({ success: true, message: 'Server refreshed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to refresh server' });
    }
  });

  // Get all available tools
  router.get('/tools', (req, res) => {
    const servers = serverManager.getAllServerStatus();
    const allTools = servers.reduce((acc, server) => {
      acc[server.id] = server.tools;
      return acc;
    }, {} as Record<string, any>);
    res.json(allTools);
  });

  // Get tools for specific server
  router.get('/servers/:id/tools', (req, res) => {
    const server = serverManager.getServerStatus(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    res.json(server.tools);
  });

  // Call tool (auto-detect server)
  router.post('/call', async (req, res) => {
    try {
      const request: MCPCallRequest = req.body;
      const result = await serverManager.callTool(request);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      });
    }
  });

  // Call specific tool on specific server
  router.post('/servers/:id/tools/:toolName', async (req, res) => {
    try {
      const request: MCPCallRequest = {
        serverId: req.params.id,
        toolName: req.params.toolName,
        arguments: req.body.arguments || {},
        requestId: req.body.requestId,
        timeout: req.body.timeout,
        retryAttempts: req.body.retryAttempts
      };
      const result = await serverManager.callTool(request);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      });
    }
  });

  // Batch call multiple tools
  router.post('/batch-call', async (req, res) => {
    try {
      const requests: MCPCallRequest[] = req.body.requests || [];
      if (requests.length === 0) {
        return res.status(400).json({ error: 'No requests provided' });
      }
      
      const results = await Promise.all(
        requests.map(request => serverManager.callTool(request))
      );
      
      res.json({
        success: true,
        results,
        totalRequests: requests.length,
        successfulRequests: results.filter(r => r.success).length,
        failedRequests: results.filter(r => !r.success).length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: []
      });
    }
  });

  // MCP Protocol Support for individual servers
  // Initialize endpoint for specific server
  router.post('/servers/:id/mcp/initialize', (req, res) => {
    const { method, params } = req.body;
    const serverId = req.params.id;
    
    if (method !== 'initialize') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      });
    }

    const server = serverManager.getServerStatus(serverId);
    if (!server) {
      return res.status(404).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: {
          code: -32601,
          message: 'Server not found'
        }
      });
    }

    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: server.name,
          version: '1.0.0'
        }
      }
    });
  });

  // List tools endpoint for specific server
  router.post('/servers/:id/mcp/tools/list', async (req, res) => {
    const { method, params, id } = req.body;
    const serverId = req.params.id;
    
    if (method !== 'tools/list') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      });
    }

    try {
      const server = serverManager.getServerStatus(serverId);
      if (!server) {
        return res.status(404).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Server not found'
          }
        });
      }

      const tools = server.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));

      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: tools
        }
      });
    } catch (error) {
      res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // Call tool endpoint for specific server
  router.post('/servers/:id/mcp/tools/call', async (req, res) => {
    const { method, params, id } = req.body;
    const serverId = req.params.id;
    
    if (method !== 'tools/call') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      });
    }

    try {
      const { name, arguments: args } = params;
      
      const result = await serverManager.callTool({
        serverId,
        toolName: name,
        arguments: args
      });

      if (!result.success) {
        return res.status(500).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: result.error || 'Tool call failed'
          }
        });
      }

      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: result.data
        }
      });
    } catch (error) {
      res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // Generic MCP endpoint for specific server
  router.post('/servers/:id/mcp', async (req, res) => {
    const { method, params, id } = req.body;
    const serverId = req.params.id;
    
    switch (method) {
      case 'initialize':
        return res.redirect(307, `/api/servers/${serverId}/mcp/initialize`);
      
      case 'tools/list':
        return res.redirect(307, `/api/servers/${serverId}/mcp/tools/list`);
      
      case 'tools/call':
        return res.redirect(307, `/api/servers/${serverId}/mcp/tools/call`);
      
      default:
        res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
    }
  });

  // Get proxy information
  router.get('/info', (req, res) => {
    res.json({
      name: 'MCP HTTP Proxy',
      version: '1.0.0',
      description: 'HTTP proxy for MCP servers with per-server MCP protocol support',
      endpoints: {
        health: '/api/health',
        metrics: '/api/metrics',
        servers: '/api/servers',
        tools: '/api/tools',
        call: '/api/call',
        batchCall: '/api/batch-call',
        info: '/api/info'
      },
      mcpProtocol: {
        description: 'Each server supports the MCP protocol directly',
        endpoints: {
          initialize: 'POST /api/servers/:id/mcp/initialize',
          toolsList: 'POST /api/servers/:id/mcp/tools/list',
          toolsCall: 'POST /api/servers/:id/mcp/tools/call',
          generic: 'POST /api/servers/:id/mcp'
        },
        example: {
          initialize: {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {}
          },
          toolsList: {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          },
          toolsCall: {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
              name: 'list_directory',
              arguments: { path: '.' }
            }
          }
        },
        configuration: {
          description: 'Configure in your MCP client like this:',
          example: {
            name: 'Filesystem Server',
            description: 'Filesystem server via HTTP proxy',
            type: 'http',
            transport: {
              type: 'http',
              url: 'http://localhost:3000/api/servers/filesystem/mcp'
            }
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  return router;
} 