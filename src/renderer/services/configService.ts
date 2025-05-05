import { MCPConfig, MCPServer } from "@/types/mcp"

/**
 * Clase para validar y procesar la configuración de MCP
 */
export class ConfigService {
  /**
   * Parsea una cadena JSON y devuelve un objeto MCPConfig validado
   */
  static parseConfig(jsonString: string): MCPConfig {
    try {
      const parsed = JSON.parse(jsonString)
      return this.validateAndNormalizeConfig(parsed)
    } catch (error) {
      console.error("Error parsing JSON:", error)
      // Return default config if parsing fails
      return this.createDefaultConfig()
    }
  }

  /**
   * Valida y normaliza la estructura de configuración
   * También migra automáticamente del formato antiguo al nuevo si es necesario
   */
  static validateAndNormalizeConfig(config: any): MCPConfig {
    const normalizedConfig: MCPConfig = {
      mcpServers: {},
    }

    // Verifica que mcpServers sea un objeto
    if (typeof config.mcpServers === "object" && config.mcpServers !== null) {
      // Procesa cada servidor en mcpServers
      Object.entries(config.mcpServers).forEach(([id, serverData]) => {
        if (this.isValidServer(serverData)) {
          normalizedConfig.mcpServers[id] = this.normalizeServer(serverData as any)
        } else {
          console.warn(`Server ${id} has invalid structure, skipping`)
        }
      })
    }

    return normalizedConfig
  }

  /**
   * Migra desde el formato antiguo (array de servers) al nuevo (objeto mcpServers)
   */
  static migrateFromOldFormat(oldConfig: any): MCPConfig {
    const newConfig: MCPConfig = {
      mcpServers: {},
    }

    // Migrar servidores del formato array al formato objeto
    if (oldConfig.servers && Array.isArray(oldConfig.servers)) {
      oldConfig.servers.forEach((server: any) => {
        if (server && server.id && typeof server.id === "string") {
          newConfig.mcpServers[server.id] = this.normalizeServer(server)
        }
      })
    }

    // También incorporar cualquier servidor que ya esté en mcpServers
    if (oldConfig.mcpServers && typeof oldConfig.mcpServers === "object") {
      Object.entries(oldConfig.mcpServers).forEach(([id, serverData]) => {
        if (this.isValidServer(serverData)) {
          newConfig.mcpServers[id] = this.normalizeServer(serverData as any)
        }
      })
    }

    return newConfig
  }

  /**
   * Verifica si un servidor tiene los campos requeridos
   */
  static isValidServer(server: any): boolean {
    if (!server || typeof server !== "object") {
      return false
    }

    return typeof server.command === "string"
  }

  /**
   * Normaliza un objeto servidor asegurando que tenga todos los campos necesarios
   */
  static normalizeServer(server: any): MCPServer {
    return {
      command: server.command,
      args: Array.isArray(server.args) ? server.args : [],
      env: server.env && typeof server.env === "object" ? server.env : {},
    }
  }

  /**
   * Crea un objeto de configuración predeterminado
   */
  static createDefaultConfig(): MCPConfig {
    return {
      mcpServers: {},
    }
  }

  /**
   * Comprueba si un servidor existe en la configuración
   */
  static serverExists(config: MCPConfig, serverId: string): boolean {
    return !!(config.mcpServers && config.mcpServers[serverId])
  }

  /**
   * Busca un servidor por ID
   */
  static findServerById(config: MCPConfig, serverId: string): MCPServer | null {
    if (this.serverExists(config, serverId)) {
      return config.mcpServers[serverId]
    }
    return null
  }

  /**
   * Convierte el objeto de configuración a JSON
   * Solo incluye los campos estándar de la estructura
   */
  static stringifyConfig(config: MCPConfig): string {
    // Crear un objeto que solo contenga mcpServers para asegurarnos de no incluir otros campos
    const cleanConfig = {
      mcpServers: { ...config.mcpServers },
    }

    return JSON.stringify(cleanConfig, null, 2)
  }

  /**
   * Obtiene la lista de servidores como un array con su ID
   * @param config Configuración
   * @returns Array de servidores con sus IDs
   */
  static getServersArray(config: MCPConfig): Array<{ id: string; server: MCPServer }> {
    return Object.entries(config.mcpServers).map(([id, server]) => ({
      id,
      server,
    }))
  }
}
