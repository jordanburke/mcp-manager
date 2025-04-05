# MCP Server Manager

A web-based GUI tool for managing Model Context Protocol (MCP) servers in Claude and Cursor. This tool allows you to easily enable/disable MCP servers and their tools through a user-friendly interface.

## Features

- 🎛️ Enable/disable MCP servers with simple toggle switches
- 🔄 Changes are automatically synced between Claude and Cursor
- 🛠️ View available tools for each server
- 🔒 Secure handling of environment variables and API keys
- 📱 Responsive design that works on any screen size

![MCP Server Manager Interface](https://github.com/MediaPublishing/mcp-manager/blob/main/MCP-Server-Manager.png?raw=true)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/mcp-manager.git
cd mcp-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a configuration file:
```bash
cp config.example.json config.json
```

4. Start the server:
```bash
npm start
```

5. Open http://localhost:3456 in your browser

## Configuration

The MCP Server Manager uses two configuration files:

- `config.json`: Main configuration file for the server
- Claude config: Located at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- Cursor config: Located at `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` (macOS)

### Example Configuration

```json
{
  "mcpServers": {
    "example-server": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## Development

This project uses TypeScript and Vite for development, which provides:
- Static typing with TypeScript
- Fast Hot Module Replacement (HMR)
- Modern development experience
- Optimized production builds

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `config.json` file:
```bash
cp config.example.json config.json
```
Then edit the file to include your MCP server configurations.

### Development Workflow

There are several ways to run the project:

1. **Full Development Mode** (recommended):
   This runs both the backend server and the Vite dev server with hot reloading.
   ```bash
   pnpm dev:full
   ```
   - Backend API: http://localhost:3456
   - Frontend dev server: http://localhost:5173

2. **Frontend Development Only**:
   ```bash
   pnpm dev
   ```
   This starts the Vite dev server only. API calls are proxied to the backend.

3. **Backend Development Only**:
   ```bash
   pnpm server
   ```
   This starts the backend server with nodemon for auto-reloading.

### Building for Production

To build the frontend for production:
```bash
pnpm build
```

This will create optimized files in the `dist` directory and compile the TypeScript server code to JavaScript in the `dist-server` directory.

To run the production version:
```bash
pnpm start
```

This will serve the built frontend from the `dist` directory and start the backend server.

## Usage

1. Launch the MCP Server Manager
2. Use the toggle switches to enable/disable servers
3. Click "Save Changes" to apply your changes
4. Restart Claude to activate the new configuration

## Keywords

- Model Context Protocol (MCP)
- Claude AI
- Anthropic Claude
- Cursor Editor
- MCP Server Management
- Claude Configuration
- AI Tools Management
- Claude Extensions
- MCP Tools
- AI Development Tools

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for use with Anthropic's Claude AI
- Compatible with the Cursor editor
- Uses the Model Context Protocol (MCP)
