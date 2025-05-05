import {exec} from "child_process"
import {app, BrowserWindow, ipcMain, Menu, shell} from "electron"
import isDev from "electron-is-dev"
import fs from "fs"
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
      return await fs.promises.readFile(claudeConfigPath, "utf8")
    } catch (error) {
      console.error("Error reading Claude config:", error)
      throw new Error(`Failed to read Claude configuration: ${error.message}`)
    }
  })

  // Ping an MCP server to check if it's running
  ipcMain.handle("ping-mcp-server", async (event, serverId, server) => {
    try {
      console.log(`Checking status for MCP server: ${serverId}`)
      
      // Extract command details for better process matching
      const baseCommand = server.command.split(' ')[0]; // Base command (e.g., python, node)
      const scriptName = server.command.split(' ').length > 1 ? 
                         server.command.split(' ')[1] : ''; // Script name if present
      
      // Extract any distinctive argument that might help identify this specific process
      let distinctiveArg = '';
      if (Array.isArray(server.args) && server.args.length > 0) {
        // Find a distinctive argument by looking for one with a non-common name
        // Avoid arguments like --port, --host which are common across many processes
        distinctiveArg = server.args.find(arg => 
          !arg.startsWith('--port') && 
          !arg.startsWith('--host') && 
          !arg.startsWith('-p') && 
          !arg.startsWith('-h')
        ) || server.args[0]; // Fallback to first arg if no distinctive one found
      }
      
      console.log(`Looking for process: ${baseCommand} with script: ${scriptName} and distinctive arg: ${distinctiveArg}`);
      
      // Use different commands based on the platform
      const platform = process.platform;
      let cmd = '';
      
      if (platform === 'win32') {
        // Windows approach - check for the process and check the details
        cmd = `tasklist /FI "IMAGENAME eq ${baseCommand}*" /NH`;
      } else {
        // Unix-based approach - more precise with grep to include distinctive elements
        // If we have a script name, include it in the search to be more specific
        let grepPattern = baseCommand;
        
        if (scriptName) {
          grepPattern += `.*${scriptName}`;
        }
        
        // If we have a distinctive argument, include that too
        if (distinctiveArg) {
          grepPattern += `.*${distinctiveArg}`;
        }
        
        cmd = `ps aux | grep "${grepPattern}" | grep -v grep`;
      }
      
      console.log(`Executing: ${cmd}`);
      
      // Execute the status check and return details
      return new Promise((resolve) => {
        exec(cmd, (error, stdout) => {
          // Process the output
          const output = stdout.trim();
          
          // Check if we found any matching process
          if (error || !output) {
            console.log(`No matching process found for server: ${serverId}`);
            resolve({ 
              success: false,
              details: { 
                command: server.command,
                found: false 
              }
            });
            return;
          }
          
          // We found matching processes!
          const processLines = output.split('\\n');
          const processCount = processLines.length;
          
          console.log(`Found ${processCount} matching process(es) for server: ${serverId}`);
          
          // Log the first few lines of process info for debugging
          if (processCount > 0) {
            console.log('Process details:');
            processLines.slice(0, Math.min(3, processCount)).forEach(line => {
              console.log(`- ${line.substring(0, 100)}...`);
            });
          }
          
          resolve({ 
            success: true, 
            details: {
              command: server.command,
              found: true,
              count: processCount,
              // Include sample of process info for debugging
              sample: processLines.length > 0 ? processLines[0].substring(0, 100) : ''
            }
          });
        });
      });
    } catch (error) {
      console.error(`Error pinging MCP server ${serverId}:`, error)
      return { 
        success: false, 
        error: error.message,
        details: { command: server.command, found: false }
      }
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

// Quit when all windows are closed, except on macOS. There, it's common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
