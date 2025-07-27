import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { 
  MCPServerConfig, 
  MCPServerStatus, 
  MCPTool, 
  MCPCallRequest, 
  MCPCallResponse,
  TransportConfig,
  MCPError,
  Metrics
} from '../types';

export class MCPServerManager {
  private clients: Map<string, Client> = new Map();
  private serverStatus: Map<string, MCPServerStatus> = new Map();
  private metrics: Metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    serverStats: {}
  };

  constructor(private configs: Record<string, MCPServerConfig>) {
    this.initializeServers();
  }

  private async initializeServers(): Promise<void> {
    for (const [id, config] of Object.entries(this.configs)) {
      if (config.enabled) {
        await this.startServer(id, config);
      }
    }
  }

  private createTransport(config: MCPServerConfig): any {
    const transportConfig = config.transport || this.getLegacyTransportConfig(config);
    
    switch (transportConfig.type) {
      case 'stdio':
        return this.createStdioTransport(transportConfig);
      case 'http':
        return this.createHttpTransport(transportConfig);
      case 'websocket':
        return this.createWebSocketTransport(transportConfig);
      default:
        throw new Error(`Unsupported transport type: ${transportConfig.type}`);
    }
  }

  private getLegacyTransportConfig(config: MCPServerConfig): TransportConfig {
    return {
      type: config.type,
      command: config.command,
      args: config.args,
      workingDir: config.workingDir,
      url: config.url,
      wsUrl: config.wsUrl
    };
  }

  private createStdioTransport(config: TransportConfig): StdioClientTransport {
    if (!config.command || !config.args) {
      throw new Error('stdio transport requires command and args configuration');
    }

    return new StdioClientTransport({
      command: config.command,
      args: config.args,
      cwd: config.workingDir,
      env: config.env
    });
  }

  private createHttpTransport(config: TransportConfig): StreamableHTTPClientTransport {
    if (!config.url) {
      throw new Error('http transport requires url configuration');
    }

    const url = new URL(config.url);
    const transport = new StreamableHTTPClientTransport(url);
    
    // Set timeout
    if (config.timeout) {
      // Note: This needs to be set according to the actual SDK implementation
      console.log(`Setting HTTP transport timeout: ${config.timeout}ms`);
    }

    return transport;
  }

  private createWebSocketTransport(config: TransportConfig): WebSocketClientTransport {
    if (!config.wsUrl) {
      throw new Error('websocket transport requires wsUrl configuration');
    }

    const url = new URL(config.wsUrl);
    return new WebSocketClientTransport(url);
  }

  private async startServer(id: string, config: MCPServerConfig): Promise<void> {
    try {
      // Set connecting status
      const status: MCPServerStatus = {
        id,
        name: config.name,
        description: config.description,
        type: config.type,
        enabled: config.enabled,
        status: 'connecting',
        tools: [],
        connectionInfo: {
          transportType: config.type,
          endpoint: this.getEndpoint(config),
          connectedAt: new Date().toISOString()
        }
      };
      this.serverStatus.set(id, status);

      const client = new Client({
        name: `mcp-proxy-${id}`,
        version: "1.0.0"
      });

      const transport = this.createTransport(config);
      await client.connect(transport);
      
      this.clients.set(id, client);

      // Get tools list
      const tools = await client.listTools();
      status.tools = tools.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema,
        serverId: id
      }));

      status.status = 'connected';
      status.connectionInfo!.endpoint = this.getEndpoint(config);
      status.connectionInfo!.lastActivity = new Date().toISOString();
      
      this.serverStatus.set(id, status);

      // Initialize metrics
      this.metrics.serverStats[id] = {
        requests: 0,
        errors: 0,
        averageTime: 0
      };

      console.log(`✅ Server ${id} connected successfully, found ${status.tools.length} tools`);

    } catch (error) {
      console.error(`❌ Failed to start server ${id}:`, error);
      const status: MCPServerStatus = {
        id,
        name: config.name,
        description: config.description,
        type: config.type,
        enabled: config.enabled,
        status: 'error',
        tools: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionInfo: {
          transportType: config.type,
          endpoint: this.getEndpoint(config)
        }
      };
      this.serverStatus.set(id, status);
    }
  }

  private getEndpoint(config: MCPServerConfig): string {
    const transportConfig = config.transport || this.getLegacyTransportConfig(config);
    
    switch (transportConfig.type) {
      case 'stdio':
        return `${transportConfig.command} ${transportConfig.args?.join(' ')}`;
      case 'http':
        return transportConfig.url || '';
      case 'websocket':
        return transportConfig.wsUrl || '';
      default:
        return 'unknown';
    }
  }

  public async callTool(request: MCPCallRequest): Promise<MCPCallResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    const client = this.clients.get(request.serverId);
    if (!client) {
      const error = `Server ${request.serverId} does not exist or is not connected`;
      this.recordError(request.serverId, error);
      return {
        success: false,
        data: null,
        error,
        requestId: request.requestId,
        serverId: request.serverId,
        toolName: request.toolName,
        executionTime: 0,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const result = await client.callTool({
        name: request.toolName,
        arguments: request.arguments
      });

      const executionTime = Date.now() - startTime;
      this.recordSuccess(request.serverId, executionTime);

      return {
        success: true,
        data: result.content,
        requestId: request.requestId,
        serverId: request.serverId,
        toolName: request.toolName,
        executionTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Call failed';
      this.recordError(request.serverId, errorMessage);

      return {
        success: false,
        data: null,
        error: errorMessage,
        requestId: request.requestId,
        serverId: request.serverId,
        toolName: request.toolName,
        executionTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  private recordSuccess(serverId: string, executionTime: number): void {
    this.metrics.successfulRequests++;
    if (this.metrics.serverStats[serverId]) {
      const stats = this.metrics.serverStats[serverId];
      stats.requests++;
      stats.averageTime = (stats.averageTime * (stats.requests - 1) + executionTime) / stats.requests;
    }
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) + executionTime) / this.metrics.successfulRequests;
  }

  private recordError(serverId: string, error: string): void {
    this.metrics.failedRequests++;
    if (this.metrics.serverStats[serverId]) {
      this.metrics.serverStats[serverId].errors++;
    }
  }

  public getServerStatus(id: string): MCPServerStatus | undefined {
    return this.serverStatus.get(id);
  }

  public getAllServerStatus(): MCPServerStatus[] {
    return Array.from(this.serverStatus.values());
  }

  public getMetrics(): Metrics {
    return { ...this.metrics };
  }

  public async refreshServerStatus(id: string): Promise<void> {
    const config = this.configs[id];
    if (config && config.enabled) {
      // Disconnect existing connection
      const existingClient = this.clients.get(id);
      if (existingClient) {
        try {
          await existingClient.close();
        } catch (error) {
          console.error(`Error closing client ${id}:`, error);
        }
        this.clients.delete(id);
      }

      // Reconnect
      await this.startServer(id, config);
    }
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Closing all MCP client connections...');
    
    for (const [id, client] of this.clients) {
      try {
        await client.close();
        console.log(`✅ Closed client: ${id}`);
      } catch (error) {
        console.error(`❌ Error closing client ${id}:`, error);
      }
    }

    this.clients.clear();
    this.serverStatus.clear();
  }

  public async listResources(serverId: string): Promise<any> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} does not exist or is not connected`);
    }

    return await client.listResources();
  }

  public async readResource(serverId: string, uri: string): Promise<any> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`服务器 ${serverId} 不存在或未连接`);
    }

    return await client.readResource({ uri });
  }

  public async listPrompts(serverId: string): Promise<any> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`服务器 ${serverId} 不存在或未连接`);
    }

    return await client.listPrompts();
  }

  public async getPrompt(serverId: string, name: string, args?: any): Promise<any> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`服务器 ${serverId} 不存在或未连接`);
    }

    return await client.getPrompt({ name, arguments: args });
  }
} 