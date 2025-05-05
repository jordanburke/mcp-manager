import { exec } from "child_process"
import { app, BrowserWindow, ipcMain, Menu, shell } from "electron"
import isDev from "electron-is-dev"
import fs from "fs"
import net from "net"
import path from "path"

// Keep a global reference of the window object to prevent the window from being automatically closed when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null

// Path to the Claude configuration file
const getClaudeConfigPath = () => {
  const home = app.getPath("home")
  const platform = process.platform

  if (platform === "darwin") {
    // macOS
    return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
  } else if (platform === "win32") {
    // Windows
    return path.join(home, "AppData/Roaming/Claude/claude_desktop_config.json")
  } else {
    // Linux and other platforms
    return path.join(home, ".config/Claude/claude_desktop_config.json")
  }
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
      webSecurity: !isDev, // Disable web security in development
    },
    icon: path.join(__dirname, isDev ? "../../assets/icons/icon.png" : "../assets/icons/icon.png"),
    show: false,
    backgroundColor: "#ffffff",
    titleBarStyle: "default",
    resizable: true,
    movable: true,
    frame: true,
  })

  // Show the window only when it's ready to avoid flickering
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show()
  })

  // Load the application URL.
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
    // Open DevTools in development.
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"))
  }

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  // Create the application menu
  createMenu()

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Remove the reference to the window object
    mainWindow = null
  })
}

// Create the application menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            await shell.openExternal("https://github.com/iagolast/mcp-manager")
          },
        },
        {
          label: "About",
          click: () => {
            const version = app.getVersion()
            const aboutMessage = `MCP Manager\nVersion: ${version}\n\nA desktop application for managing Model Context Protocol (MCP) servers.`
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                alert('${aboutMessage}');
              `)
            }
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template as unknown[])
  Menu.setApplicationMenu(menu)
}

// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Expose platform information to the renderer process
  ipcMain.handle("get-platform", () => {
    return process.platform
  })

  // Read the MCP configuration (now from the Claude file)
  ipcMain.handle("get-mcp-config", async () => {
    try {
      const configPath = getClaudeConfigPath()

      // If the file doesn't exist, create one with the default configuration
      if (!fs.existsSync(configPath)) {
        const defaultConfig = {
          mcpServers: {},
        }
        await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2))
        return JSON.stringify(defaultConfig)
      }

      // Read the existing file
      const data = await fs.promises.readFile(configPath, "utf8")
      return data
    } catch (error) {
      console.error("Error reading Claude config:", error)
      throw new Error("Failed to read configuration")
    }
  })

  // Save the MCP configuration (now in the Claude file)
  ipcMain.handle("save-mcp-config", async (event, jsonData) => {
    try {
      const configPath = getClaudeConfigPath()
      await fs.promises.writeFile(configPath, jsonData)
      return true
    } catch (error) {
      console.error("Error saving Claude config:", error)
      throw new Error("Failed to save configuration")
    }
  })

  // Read the Claude desktop config - now the same as get-mcp-config
  ipcMain.handle("get-claude-config", async () => {
    try {
      const claudeConfigPath = getClaudeConfigPath()

      // Check if file exists
      if (!fs.existsSync(claudeConfigPath)) {
        throw new Error("Claude desktop configuration file not found")
      }

      // Read the file
      const data = await fs.promises.readFile(claudeConfigPath, "utf8")
      return data
    } catch (error) {
      console.error("Error reading Claude config:", error)
      throw new Error(`Failed to read Claude configuration: ${error.message}`)
    }
  })

  // Ping an MCP server to check if it's running
  ipcMain.handle("ping-mcp-server", async (event, serverId, server) => {
    try {
      // First, check if the command exists
      const isCommandAvailable = await checkCommandAvailability(server.command)
      if (!isCommandAvailable) {
        console.warn(`Command not available: ${server.command}`)
        return { success: false, error: "Command not available" }
      }

      // Try to connect to the server using the Model Context Protocol
      const pingSuccess = await checkMCPServerConnection(server)
      return { success: pingSuccess }
    } catch (error) {
      console.error(`Error pinging MCP server ${serverId}:`, error)
      return { success: false, error: error.message }
    }
  })

  // Create the main window
  createWindow()
  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Check if a command is available in the system
async function checkCommandAvailability(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const platform = process.platform
    const cmd = platform === "win32" ? "where" : "which"

    exec(`${cmd} ${command}`, (error) => {
      if (error) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

// Check if an MCP server is responding
async function checkMCPServerConnection(server: unknown): Promise<boolean> {
  // Type guard to check if object has the shape of an MCPServer
  function isMCPServer(obj: unknown): obj is { command: string; args: string[]; env: { [key: string]: string } } {
    return (
      obj !== null &&
      typeof obj === "object" &&
      "args" in obj &&
      Array.isArray((obj as any).args) &&
      "env" in obj &&
      typeof (obj as any).env === "object"
    )
  }

  // For MCP servers, we'll try to make a simple MCP connection
  // This is a simplified implementation - in a real-world scenario,
  // you would need to follow the MCP protocol more precisely
  return new Promise((resolve) => {
    try {
      // Ensure the server is a valid MCP server
      if (!isMCPServer(server)) {
        console.error("Invalid server configuration")
        resolve(false)
        return
      }

      // Extract port from environment variables or command line arguments
      let port = 0

      // Try to find port in environment variables
      if (server.env && server.env.MCP_PORT) {
        port = parseInt(server.env.MCP_PORT, 10)
      }

      // Otherwise try to find port in command line arguments (simple check)
      if (!port && Array.isArray(server.args)) {
        for (let i = 0; i < server.args.length; i++) {
          if (server.args[i].includes("--port=")) {
            const portArg = server.args[i].split("=")[1]
            port = parseInt(portArg, 10)
            break
          }
          if (server.args[i] === "--port" && i < server.args.length - 1) {
            port = parseInt(server.args[i + 1], 10)
            break
          }
        }
      }

      // If we couldn't determine a port, assume port 8080 as fallback
      if (!port || isNaN(port)) {
        port = 8080
      }

      // Try to connect to the port
      const socket = new net.Socket()

      socket.setTimeout(1000) // 1 second timeout

      socket.on("connect", () => {
        socket.destroy()
        resolve(true)
      })

      socket.on("timeout", () => {
        socket.destroy()
        resolve(false)
      })

      socket.on("error", () => {
        socket.destroy()
        resolve(false)
      })

      socket.connect(port, "localhost")
    } catch (error) {
      console.error("Error checking server connection:", error)
      resolve(false)
    }
  })
}

// Quit when all windows are closed, except on macOS. There, it's common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
