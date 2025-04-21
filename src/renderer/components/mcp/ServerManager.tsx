import React, { useState, useEffect } from 'react';
import { Container, Title, Group, Paper, Text, Box, Loader, Button, Stack, Table } from '@mantine/core';
import ServerCard from './ServerCard';
import ServerDialog from './ServerDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import ImportJsonDialog from './ImportJsonDialog';
import * as mcpService from '../../services/mcpService';
import { EditableMCPServer, MCPServer, MCPConfig, ServerStatus } from '../../types/mcp';

const ServerManager: React.FC = () => {
  const [servers, setServers] = useState<Record<string, MCPServer>>({});
  const [serverIds, setServerIds] = useState<string[]>([]);
  const [serverStatuses, setServerStatuses] = useState<Record<string, ServerStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  
  useEffect(() => {
    loadServers();
  }, []);
  
  const loadServers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = await mcpService.getMCPConfig();
      setServers(config.mcpServers || {});
      setServerIds(Object.keys(config.mcpServers || {}));
      
      // Initialize all server statuses as unknown
      const initialStatuses: Record<string, ServerStatus> = {};
      Object.keys(config.mcpServers || {}).forEach(serverId => {
        initialStatuses[serverId] = ServerStatus.UNKNOWN;
      });
      setServerStatuses(initialStatuses);
      
      setIsLoading(false);
      
      // Check server statuses in the background
      checkAllServerStatuses();
    } catch (err: any) {
      setError(err?.message || 'Error loading MCP servers');
      setIsLoading(false);
      console.error('Error loading MCP servers:', err);
    }
  };
  
  const handleAddServer = async (server: EditableMCPServer) => {
    try {
      await mcpService.addMCPServer(server, server.id);
      setIsAddDialogOpen(false);
      loadServers();
    } catch (err) {
      console.error('Error adding server:', err);
      setError('Failed to add server');
    }
  };
  
  /**
   * Handles updating a server, including potential ID changes
   * @param server Updated server data
   */
  const handleEditServer = async (server: EditableMCPServer) => {
    if (!currentServerId) return;
    
    try {
      // Use the new function that handles ID changes
      await mcpService.updateMCPServerWithId(currentServerId, server);
      setIsEditDialogOpen(false);
      setCurrentServerId(null);
      loadServers();
    } catch (err) {
      console.error('Error updating server:', err);
      setError('Failed to update server');
    }
  };
  
  const handleDeleteServer = async () => {
    if (!currentServerId) return;
    
    try {
      await mcpService.deleteMCPServer(currentServerId);
      setIsDeleteDialogOpen(false);
      setCurrentServerId(null);
      loadServers();
    } catch (err) {
      console.error('Error deleting server:', err);
      setError('Failed to delete server');
    }
  };

  const handleImportFromJson = async (importedConfig: MCPConfig) => {
    try {
      // Get the current configuration
      const currentConfig = await mcpService.getMCPConfig();
      
      // Create a new merged configuration
      const mergedConfig: MCPConfig = { 
        mcpServers: { ...currentConfig.mcpServers }
      };
      
      // Add all imported servers that don't already exist
      let newServersCount = 0;
      Object.entries(importedConfig.mcpServers).forEach(([serverId, server]) => {
        if (!mergedConfig.mcpServers[serverId]) {
          mergedConfig.mcpServers[serverId] = server;
          newServersCount++;
        }
      });
      
      // Save the merged configuration
      await mcpService.saveMCPConfig(mergedConfig);
      setIsImportDialogOpen(false);
      
      // Show success message
      alert(`Imported ${newServersCount} new server${newServersCount !== 1 ? 's' : ''}`);
      
      // Reload servers to update the UI
      loadServers();
    } catch (err) {
      console.error('Error importing servers from JSON:', err);
      setError('Failed to import servers from JSON');
    }
  };
  
  const openEditDialog = (serverId: string) => {
    setCurrentServerId(serverId);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (serverId: string) => {
    setCurrentServerId(serverId);
    setIsDeleteDialogOpen(true);
  };
  
  // Check the status of all servers
  const checkAllServerStatuses = async () => {
    try {
      // Mark all servers as checking
      const checkingStatuses = { ...serverStatuses };
      Object.keys(servers).forEach(serverId => {
        checkingStatuses[serverId] = ServerStatus.CHECKING;
      });
      setServerStatuses(checkingStatuses);
      
      // Ping all servers
      const statuses = await mcpService.pingAllMCPServers();
      setServerStatuses(statuses);
    } catch (error) {
      console.error('Error checking server statuses:', error);
    }
  };
  
  // Check the status of a single server
  const checkServerStatus = async (serverId: string) => {
    try {
      // Mark server as checking
      setServerStatuses(prev => ({
        ...prev,
        [serverId]: ServerStatus.CHECKING,
      }));
      
      // Ping the server
      const status = await mcpService.pingMCPServer(serverId, servers[serverId]);
      
      // Update the status
      setServerStatuses(prev => ({
        ...prev,
        [serverId]: status,
      }));
    } catch (error) {
      console.error(`Error checking server status for ${serverId}:`, error);
      setServerStatuses(prev => ({
        ...prev,
        [serverId]: ServerStatus.OFFLINE,
      }));
    }
  };
  
  if (isLoading) {
    return (
      <Box ta="center" py="xl">
        <Title order={2} mb="md">Loading MCP Servers...</Title>
        <Loader size="md" />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box ta="center" py="xl">
        <Title order={2} mb="xs">Error Loading Servers</Title>
        <Text mb="md" c="dimmed">{error}</Text>
        <Button variant="outline" onClick={loadServers}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p="md">
      <Group justify="space-between" align="center" mb="md">
        <Title order={2} size="h3">MCP Servers</Title>
        <Group>
          <Button variant="outline" onClick={checkAllServerStatuses}>
            Check All Statuses
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            Paste from JSON
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            + Add Server
          </Button>
        </Group>
      </Group>
      
      {serverIds.length === 0 ? (
        <Paper p="xl" withBorder ta="center">
          <Title order={3} mb="xs">No MCP Servers Configured</Title>
          <Text mb="md" c="dimmed">
            MCP servers are used to manage your cluster configuration.
          </Text>
          <Group justify="center">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              Paste from JSON
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              + Add Your First Server
            </Button>
          </Group>
        </Paper>
      ) : (
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={80}>Status</Table.Th>
                <Table.Th w="15%">Server ID</Table.Th>
                <Table.Th w="30%">Command</Table.Th>
                <Table.Th w="15%">Arguments</Table.Th>
                <Table.Th w="15%">Env Variables</Table.Th>
                <Table.Th w="15%" ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {serverIds.map(serverId => (
                <ServerCard
                  key={serverId}
                  server={servers[serverId]}
                  serverId={serverId}
                  status={serverStatuses[serverId] || ServerStatus.UNKNOWN}
                  onEdit={() => openEditDialog(serverId)}
                  onDelete={() => openDeleteDialog(serverId)}
                  onCheckStatus={() => checkServerStatus(serverId)}
                />
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
      
      <ServerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddServer}
        title="Add New Server"
      />
      
      <ServerDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setCurrentServerId(null);
        }}
        onSubmit={handleEditServer}
        server={currentServerId ? servers[currentServerId] : undefined}
        serverId={currentServerId || undefined}
        title={currentServerId ? `Edit Server: ${currentServerId}` : "Edit Server"}
      />
      
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCurrentServerId(null);
        }}
        onConfirm={handleDeleteServer}
        serverName={currentServerId || 'this server'}
      />

      <ImportJsonDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportFromJson}
      />
    </Box>
  );
};

export default ServerManager;