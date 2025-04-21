import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import ServerManager from './components/mcp/ServerManager';

// Declare a type for the window with electron property
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      }
    }
  }
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'json' | 'manager'>('manager');
  const [jsonData, setJsonData] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [configPath, setConfigPath] = useState<string>('');

  // Determine the configuration path based on the operating system
  const determineConfigPath = async () => {
    try {
      // Get the platform from the main process
      const platform = await window.electron.ipcRenderer.invoke('get-platform');

      if (platform === 'darwin') {
        // macOS
        setConfigPath('~/Library/Application Support/Claude/claude_desktop_config.json');
      } else if (platform === 'win32') {
        // Windows
        setConfigPath('%APPDATA%\\Claude\\claude_desktop_config.json');
      } else {
        // Linux and other platforms
        setConfigPath('~/.config/Claude/claude_desktop_config.json');
      }
    } catch (error) {
      // Fallback to macOS path if there's an error
      setConfigPath('~/Library/Application Support/Claude/claude_desktop_config.json');
      console.error('Error determining platform:', error);
    }
  };

  // Call determineConfigPath when component mounts
  useEffect(() => {
    determineConfigPath();
  }, []);

  const loadJsonData = async () => {
    setIsLoading(true);
    try {
      const jsonData = await window.electron.ipcRenderer.invoke('get-mcp-config');

      // Format the JSON for better readability
      try {
        const formattedJson = JSON.stringify(JSON.parse(jsonData), null, 2);
        setJsonData(formattedJson);
        setJsonError(null);
      } catch (error) {
        // If it's not a valid JSON, show the plain text
        setJsonData(jsonData);
        setJsonError('The file does not contain valid JSON');
      }
    } catch (error: any) {
      setJsonData(null);
      setJsonError(`Error communicating with the main process: ${error?.message || 'Unknown'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load JSON data when switching to JSON view
  React.useEffect(() => {
    if (activeView === 'json') {
      loadJsonData();
    }
  }, [activeView]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b pt-8">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-7xl">
          <h1 className="text-2xl font-bold">MCP Manager</h1>
          <div className="flex space-x-2">
            <Button 
              variant={activeView === 'manager' ? 'default' : 'outline'} 
              onClick={() => setActiveView('manager')}
            >
              Visual Editor
            </Button>
            <Button 
              variant={activeView === 'json' ? 'default' : 'outline'} 
              onClick={() => setActiveView('json')}
            >
              View JSON
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow bg-background">
        <div className="mx-auto max-w-7xl w-full">
          {activeView === 'manager' ? (
            <ServerManager />
          ) : (
            <div className="container mx-auto p-8">
              <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Configuration JSON File</h2>
                  <div className="flex space-x-2">
                    <Button onClick={loadJsonData} disabled={isLoading}>
                      {isLoading ? 'Loading...' : 'Reload'}
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  <code className="bg-muted px-1 py-0.5 rounded">{configPath}</code>
                </p>

                {jsonError && (
                  <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-4">
                    {jsonError}
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center p-12">Loading data...</div>
                ) : jsonData ? (
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[70vh] w-full text-sm">
                    {jsonData}
                  </pre>
                ) : (
                  <div className="text-center p-12 bg-muted rounded-md">
                    No data available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-card border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground max-w-7xl">
          MCP Manager - Manage your Model Context Protocol servers
        </div>
      </footer>
    </div>
  );
};

export default App; 
