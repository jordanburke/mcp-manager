import express from 'express';
import type { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define types for our application
interface ConfigPaths {
  CURSOR_CONFIG_PATH: string;
  CLAUDE_CONFIG_PATH: string;
}

interface ServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

interface MCPConfig {
  mcpServers: Record<string, ServerConfig>;
}

interface ServerState {
  disabled: boolean;
}

interface MCPState {
  serverStates: Record<string, ServerState>;
}

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  server?: string;
}

// Path to the state file that will store enabled/disabled status
const STATE_FILE_PATH = path.join(__dirname, '../server-state.json');

// Get config file paths based on OS
function getConfigPaths(): ConfigPaths {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const isMac = process.platform === 'darwin';
    
    if (isMac) {
        return {
            CURSOR_CONFIG_PATH: path.join(home, 'Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            CLAUDE_CONFIG_PATH: path.join(home, 'Library/Application Support/Claude/claude_desktop_config.json')
        };
    } else if (process.platform === 'win32') {
        return {
            CURSOR_CONFIG_PATH: path.join(home, 'AppData/Roaming/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            CLAUDE_CONFIG_PATH: path.join(home, 'AppData/Roaming/Claude/claude_desktop_config.json')
        };
    } else {
        // Linux paths
        return {
            CURSOR_CONFIG_PATH: path.join(home, '.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            CLAUDE_CONFIG_PATH: path.join(home, '.config/Claude/claude_desktop_config.json')
        };
    }
}

const { CURSOR_CONFIG_PATH, CLAUDE_CONFIG_PATH } = getConfigPaths();

// Helper function to read config files
async function readConfigFile(filePath: string): Promise<MCPConfig> {
    try {
        console.log('Reading config file:', filePath);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('No existing config found, using empty config');
            return { mcpServers: {} };
        }
        console.error(`Error reading ${filePath}:`, error);
        throw error;
    }
}

// Helper function to read server state file
async function readStateFile(): Promise<MCPState> {
    try {
        console.log('Reading state file:', STATE_FILE_PATH);
        const data = await fs.readFile(STATE_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('No existing state file found, creating empty state');
            // Create an empty state file
            const emptyState: MCPState = { serverStates: {} };
            await fs.writeFile(STATE_FILE_PATH, JSON.stringify(emptyState, null, 2));
            return emptyState;
        }
        console.error(`Error reading state file:`, error);
        throw error;
    }
}

// Helper function to write server state file
async function writeStateFile(state: MCPState): Promise<void> {
    try {
        console.log('Writing state file:', STATE_FILE_PATH);
        await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
        console.log('State file written successfully');
    } catch (error) {
        console.error(`Error writing state file:`, error);
        throw error;
    }
}

// Helper function to merge configurations with state
async function mergeConfigsWithState(savedConfig: MCPConfig, defaultConfig: Record<string, ServerConfig>): Promise<MCPConfig> {
    console.log('Merging configs with state:');
    
    // Read the server state file
    const state = await readStateFile();
    console.log('Server states:', Object.keys(state.serverStates || {}));
    
    const mergedServers: Record<string, ServerConfig> = {};
    
    // Start with all default servers
    Object.entries(defaultConfig).forEach(([name, config]) => {
        mergedServers[name] = { ...config };
    });
    
    // Override with saved configurations
    Object.entries(savedConfig.mcpServers || {}).forEach(([name, config]) => {
        mergedServers[name] = {
            ...mergedServers[name],
            ...config
        };
    });
    
    // Apply disabled state from state file
    Object.entries(state.serverStates || {}).forEach(([name, serverState]) => {
        if (mergedServers[name]) {
            mergedServers[name].disabled = serverState.disabled;
        }
    });
    
    console.log('Merged servers with state:', Object.keys(mergedServers));
    return { mcpServers: mergedServers };
}

// Helper function to filter out disabled servers
function filterDisabledServers(config: MCPConfig): MCPConfig {
    const filteredConfig: MCPConfig = { mcpServers: {} };
    
    Object.entries(config.mcpServers).forEach(([name, server]) => {
        // Only include servers that are not disabled
        if (!server.disabled) {
            // Create a new server object without the disabled property
            const { disabled, ...serverConfig } = server;
            filteredConfig.mcpServers[name] = serverConfig;
        } else {
            console.log(`Filtering out disabled server: ${name}`);
        }
    });
    
    console.log('Filtered servers:', Object.keys(filteredConfig.mcpServers));
    return filteredConfig;
}

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Get cursor config
router.get('/cursor-config', async (_req: Request, res: Response) => {
    console.log('Handling /api/cursor-config request');
    try {
        const savedConfig = await readConfigFile(CURSOR_CONFIG_PATH);
        const defaultConfig = await readConfigFile(path.join(__dirname, '../config.json'));
        const mergedConfig = await mergeConfigsWithState(savedConfig, defaultConfig.mcpServers || {});
        console.log('Returning merged config with servers:', Object.keys(mergedConfig.mcpServers));
        res.json(mergedConfig);
    } catch (error: any) {
        console.error('Error in /api/cursor-config:', error);
        res.status(500).json({ error: `Failed to read Cursor config: ${error.message}` });
    }
});

// Get claude config
router.get('/claude-config', async (_req: Request, res: Response) => {
    console.log('Handling /api/claude-config request');
    try {
        const config = await readConfigFile(CLAUDE_CONFIG_PATH);
        res.json(config);
    } catch (error: any) {
        console.error('Error in /api/claude-config:', error);
        res.status(500).json({ error: `Failed to read Claude config: ${error.message}` });
    }
});

// Get tools list
router.get('/tools', async (_req: Request, res: Response) => {
    console.log('Handling /api/tools request');
    try {
        const cursorConfig = await readConfigFile(CURSOR_CONFIG_PATH);
        const defaultConfig = await readConfigFile(path.join(__dirname, '../config.json'));
        const mergedConfig = await mergeConfigsWithState(cursorConfig, defaultConfig.mcpServers || {});
        const servers = mergedConfig.mcpServers;

        // Define available tools for each server
        const toolsMap: Record<string, Tool[]> = {
            'mcp-manager': [{
                name: 'launch_manager',
                description: 'Launch the MCP Server Manager interface',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }]
        };

        // Filter tools based on enabled servers
        const enabledTools = Object.entries(toolsMap)
            .filter(([serverName]) => {
                return servers[serverName] && !servers[serverName].disabled;
            })
            .flatMap(([serverName, tools]) => 
                tools.map(tool => ({
                    ...tool,
                    server: serverName
                }))
            );

        console.log(`Returning ${enabledTools.length} tools`);
        res.json(enabledTools);
    } catch (error: any) {
        console.error('Error in /api/tools:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save configs
router.post('/save-configs', async (req: Request, res: Response) => {
    console.log('Handling /api/save-configs request');
    try {
        const { mcpServers } = req.body as { mcpServers?: Record<string, ServerConfig> };
        if (!mcpServers) {
            throw new Error('No server configuration provided');
        }

        // Check if the config files exist before writing to them
        const cursorConfigExists = await fileExists(CURSOR_CONFIG_PATH);
        const claudeConfigExists = await fileExists(CLAUDE_CONFIG_PATH);

        // Always update the state file with disabled status
        const state: MCPState = { serverStates: {} };
        
        // Extract disabled state for each server
        Object.entries(mcpServers).forEach(([name, config]) => {
            state.serverStates[name] = {
                disabled: !!config.disabled
            };
        });
        
        // Write the state file
        await writeStateFile(state);
        console.log('Server state saved successfully');

        if (!cursorConfigExists && !claudeConfigExists) {
            return res.json({
                success: true,
                message: 'Server state saved successfully. No configuration files were found to update.'
            });
        }

        // Save full config to Cursor settings (for UI state) if it exists
        const fullConfig: MCPConfig = { mcpServers };
        if (cursorConfigExists) {
            await fs.writeFile(CURSOR_CONFIG_PATH, JSON.stringify(fullConfig, null, 2));
            console.log('Cursor configuration saved successfully');
        } else {
            console.log('Skipping Cursor config save as file does not exist');
        }

        // Save filtered config to Claude settings (removing disabled servers) if it exists
        if (claudeConfigExists) {
            const filteredConfig = filterDisabledServers(fullConfig);
            console.log('Filtered config for Claude:', JSON.stringify(filteredConfig, null, 2));
            await fs.writeFile(CLAUDE_CONFIG_PATH, JSON.stringify(filteredConfig, null, 2));
            console.log('Claude configuration saved successfully');
        } else {
            console.log('Skipping Claude config save as file does not exist');
        }

        res.json({ 
            success: true, 
            message: `Configurations saved successfully${!cursorConfigExists || !claudeConfigExists ? ' (some files were not found)' : ''}. Please restart Claude to apply changes.` 
        });
    } catch (error: any) {
        console.error('Error in /api/save-configs:', error);
        res.status(500).json({ error: `Failed to save configurations: ${error.message}` });
    }
});

export default router;
