import * as fs from 'fs-extra';
import * as path from 'path';
import { Config, MCPServerConfig, ProxyConfig } from '../types';

export class ConfigManager {
  private config: Config;
  private configPath: string;

  constructor(configPath: string = 'config/mcp-servers.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    try {
      const configFile = fs.readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(configFile);
      
      // 设置默认值
      return {
        servers: parsed.servers || {},
        proxy: {
          port: 3000,
          host: 'localhost',
          cors: true,
          rateLimit: 1000,
          requestTimeout: 30000,
          maxRequestSize: '10mb',
          enableMetrics: true,
          enableLogging: true,
          ...parsed.proxy
        }
      };
    } catch (error) {
      console.error('Failed to load configuration file:', error);
      // Return default configuration
      return {
        servers: {},
        proxy: {
          port: 3000,
          host: 'localhost',
          cors: true,
          rateLimit: 1000,
          requestTimeout: 30000,
          maxRequestSize: '10mb',
          enableMetrics: true,
          enableLogging: true
        }
      };
    }
  }

  public getConfig(): Config {
    return this.config;
  }

  public getServers(): Record<string, MCPServerConfig> {
    return this.config.servers;
  }

  public getServer(id: string): MCPServerConfig | undefined {
    return this.config.servers[id];
  }

  public getProxyConfig(): ProxyConfig {
    return this.config.proxy;
  }

  public reloadConfig(): void {
    this.config = this.loadConfig();
  }

  public updateServer(id: string, config: MCPServerConfig): void {
    this.config.servers[id] = config;
    this.saveConfig();
  }

  public removeServer(id: string): void {
    delete this.config.servers[id];
    this.saveConfig();
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      fs.ensureDirSync(configDir);
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save configuration file:', error);
    }
  }
} 