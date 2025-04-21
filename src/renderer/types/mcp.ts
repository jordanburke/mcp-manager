export interface MCPServerEnv {
  [key: string]: string
}

export enum ServerStatus {
  UNKNOWN = "unknown",
  ONLINE = "online",
  OFFLINE = "offline",
  CHECKING = "checking",
}

export interface MCPServer {
  command: string
  args: string[]
  env: MCPServerEnv
}

export interface MCPConfig {
  mcpServers: {
    [serverId: string]: MCPServer
  }
}

export interface EditableMCPServer extends MCPServer {
  id: string // Para identificar el servidor en la UI
}

// For UI tracking of server status (not stored in config)
export interface ServerWithStatus extends MCPServer {
  status: ServerStatus
  lastChecked?: Date
}
