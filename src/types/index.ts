// MCP Server Types
export interface TransportConfig {
  type: 'stdio' | 'http' | 'websocket';
  
  // stdio configuration
  command?: string;
  args?: string[];
  workingDir?: string;
  env?: Record<string, string>;
  
  // http configuration
  url?: string;
  headers?: Record<string, string>;
  timeout?: number;
  
  // websocket configuration
  wsUrl?: string;
  protocols?: string[];
  
  // common configuration
  retryAttempts?: number;
  retryDelay?: number;
}

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  description: string;
  type: 'stdio' | 'http' | 'websocket';
  enabled: boolean;
  transport: TransportConfig;
  
  // Legacy configuration compatibility
  command?: string;
  args?: string[];
  workingDir?: string;
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  timeout?: number;
  wsUrl?: string;
  protocols?: string[];
  retryAttempts?: number;
  retryDelay?: number;
}

// MCP Tool Definition
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  serverId: string;
}

// MCP Server Status
export interface MCPServerStatus {
  id: string;
  name: string;
  description: string;
  type: 'stdio' | 'http' | 'websocket';
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastSeen?: string;
  error?: string;
  tools: MCPTool[];
  connectionInfo?: {
    transportType: string;
    endpoint: string;
    connectedAt?: string;
    lastActivity?: string;
  };
}

// MCP Call Request
export interface MCPCallRequest {
  serverId: string;
  toolName: string;
  arguments: Record<string, any>;
  requestId?: string;
  timeout?: number;
  retryAttempts?: number;
}

// MCP Call Response
export interface MCPCallResponse {
  success: boolean;
  data: any;
  error?: string;
  requestId?: string;
  serverId: string;
  toolName: string;
  executionTime: number;
  timestamp: string;
}

// Proxy Configuration
export interface ProxyConfig {
  port: number;
  host: string;
  cors: boolean;
  rateLimit: number;
  requestTimeout: number;
  maxRequestSize: string;
  enableMetrics: boolean;
  enableLogging: boolean;
}

// Complete Configuration
export interface Config {
  proxy: ProxyConfig;
  servers: Record<string, MCPServerConfig>;
}

// Error Types
export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

// Performance Metrics
export interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  serverStats: Record<string, {
    requests: number;
    errors: number;
    averageTime: number;
  }>;
} 