import { describe, it, expect } from "vitest"
import { ConfigService } from "../configService"
import { MCPConfig } from "../../types/mcp"

describe("ConfigService", () => {
  // Test para parseConfig con JSON válido
  it("should parse a valid JSON string into MCPConfig", () => {
    const validJson = JSON.stringify({
      mcpServers: {
        server1: {
          command: "/usr/bin/node",
          args: ["/path/to/script.js"],
          env: {
            KEY1: "value1",
            KEY2: "value2",
          },
        },
      },
    })

    const result = ConfigService.parseConfig(validJson)

    expect(result).toBeDefined()
    expect(result.mcpServers).toBeDefined()
    expect(result.mcpServers.server1).toBeDefined()
    expect(result.mcpServers.server1.command).toBe("/usr/bin/node")
    expect(result.mcpServers.server1.args).toEqual(["/path/to/script.js"])
    expect(result.mcpServers.server1.env.KEY1).toBe("value1")
  })

  // Test para parseConfig con JSON inválido
  it("should return default config when JSON is invalid", () => {
    const invalidJson = "not a json"

    const result = ConfigService.parseConfig(invalidJson)

    expect(result).toBeDefined()
    expect(result.mcpServers).toEqual({})
  })

  // Test para validateAndNormalizeConfig con configuración incompleta
  it("should normalize incomplete config", () => {
    const incompleteConfig = {
      // Sin mcpServers
    }

    const result = ConfigService.validateAndNormalizeConfig(incompleteConfig)

    expect(result).toBeDefined()
    expect(result.mcpServers).toEqual({})
  })

  // Test para validar servidores
  it("should validate server objects correctly", () => {
    const validServer = {
      command: "/usr/bin/node",
      args: [],
      env: {},
    }

    const invalidServer1 = null

    const invalidServer2 = {}

    const invalidServer3 = {
      args: [],
      env: {},
    }

    expect(ConfigService.isValidServer(validServer)).toBe(true)
    expect(ConfigService.isValidServer(invalidServer1)).toBe(false)
    expect(ConfigService.isValidServer(invalidServer2)).toBe(false)
    expect(ConfigService.isValidServer(invalidServer3)).toBe(false)
    expect(ConfigService.isValidServer(null)).toBe(false)
  })

  // Test para normalizeServer
  it("should normalize server objects with missing optional fields", () => {
    const minimalServer = {
      command: "/usr/bin/node",
      args: [],
      env: {},
    }

    const result = ConfigService.normalizeServer(minimalServer)

    expect(result).toBeDefined()
    expect(result.command).toBe("/usr/bin/node")
    expect(result.args).toEqual([])
    expect(result.env).toEqual({})
  })

  // Test para la función serverExists
  it("should check if a server exists in the config", () => {
    const config: MCPConfig = {
      mcpServers: {
        server1: {
          command: "/usr/bin/node",
          args: ["/path/to/script1.js"],
          env: {},
        },
        server2: {
          command: "/usr/bin/python",
          args: ["/path/to/script2.py"],
          env: {},
        },
      },
    }

    expect(ConfigService.serverExists(config, "server1")).toBe(true)
    expect(ConfigService.serverExists(config, "server2")).toBe(true)
    expect(ConfigService.serverExists(config, "server3")).toBe(false)
  })

  // Test para buscar servidores por ID
  it("should find a server by ID", () => {
    const config: MCPConfig = {
      mcpServers: {
        server1: {
          command: "/usr/bin/node",
          args: ["/path/to/script.js"],
          env: {},
        },
        server2: {
          command: "/usr/bin/python",
          args: ["/path/to/script.py"],
          env: {},
        },
      },
    }

    const server1 = ConfigService.findServerById(config, "server1")
    const server2 = ConfigService.findServerById(config, "server2")
    const server3 = ConfigService.findServerById(config, "server3")

    expect(server1).toBeDefined()
    expect(server1?.command).toBe("/usr/bin/node")

    expect(server2).toBeDefined()
    expect(server2?.command).toBe("/usr/bin/python")

    expect(server3).toBeNull()
  })

  // Test para la función stringifyConfig
  it("should stringify config to formatted JSON without lastUpdated or servers", () => {
    const config: MCPConfig = {
      mcpServers: {
        server1: {
          command: "/usr/bin/node",
          args: ["/path/to/script.js"],
          env: {},
        },
      },
    }

    const json = ConfigService.stringifyConfig(config)

    expect(json).toBeDefined()
    expect(json).toContain('"command": "/usr/bin/node"')
    expect(json).toContain('"args": [')
    expect(json).toContain('"env": {}')
    expect(json).not.toContain("lastUpdated")
    expect(json).not.toContain('"servers":')

    // Asegurarse de que está correctamente formateado (con indentación)
    expect(json).toContain('  "mcpServers": {')
  })

  // Test para getServersArray
  it("should convert servers object to array with IDs", () => {
    const config: MCPConfig = {
      mcpServers: {
        server1: {
          command: "/usr/bin/node",
          args: ["/path/to/script1.js"],
          env: {},
        },
        server2: {
          command: "/usr/bin/python",
          args: ["/path/to/script2.py"],
          env: {},
        },
      },
    }

    const serversArray = ConfigService.getServersArray(config)

    expect(serversArray).toHaveLength(2)
    expect(serversArray[0].id).toBe("server1")
    expect(serversArray[0].server.command).toBe("/usr/bin/node")
    expect(serversArray[1].id).toBe("server2")
    expect(serversArray[1].server.command).toBe("/usr/bin/python")
  })

  // Nuevo test para stringifyConfig
  it("should remove any non-standard fields when stringifying", () => {
    // Crear un objeto con campos no estándar
    const configWithExtraFields = {
      mcpServers: {
        server1: {
          command: "/usr/bin/node",
          args: [],
          env: {},
        },
      },
      // Campos no estándar que deberían ser eliminados
      lastUpdated: new Date().toISOString(),
      servers: [],
      version: "1.0",
    } as any

    const jsonString = ConfigService.stringifyConfig(configWithExtraFields)
    const parsedBack = JSON.parse(jsonString)

    // Verificar que solo contiene mcpServers
    expect(parsedBack).toHaveProperty("mcpServers")
    expect(parsedBack).not.toHaveProperty("lastUpdated")
    expect(parsedBack).not.toHaveProperty("servers")
    expect(parsedBack).not.toHaveProperty("version")
  })

  // Test para verificar manejo de mcpServers vacío
  it("should handle empty mcpServers object correctly", () => {
    const emptyConfig = {
      mcpServers: {},
    }

    // Verificar parseConfig con JSON vacío
    const jsonString = JSON.stringify(emptyConfig)
    const parsedConfig = ConfigService.parseConfig(jsonString)

    expect(parsedConfig).toBeDefined()
    expect(parsedConfig.mcpServers).toBeDefined()
    expect(Object.keys(parsedConfig.mcpServers)).toHaveLength(0)

    // También verificar validateAndNormalizeConfig
    const normalizedConfig = ConfigService.validateAndNormalizeConfig(emptyConfig)
    expect(normalizedConfig).toBeDefined()
    expect(normalizedConfig.mcpServers).toBeDefined()
    expect(Object.keys(normalizedConfig.mcpServers)).toHaveLength(0)

    // Verificar getServersArray con config vacía
    const serversArray = ConfigService.getServersArray(emptyConfig)
    expect(serversArray).toBeDefined()
    expect(serversArray).toHaveLength(0)
  })
})
