import React from 'react';
import { Table, Badge, Group, Button, Text, ActionIcon } from '@mantine/core';
import { MCPServer, ServerStatus } from '../../types/mcp';

interface ServerCardProps {
  server: MCPServer;
  serverId: string;
  status?: ServerStatus;
  onEdit: () => void;
  onDelete: () => void;
  onCheckStatus: () => void;
}

const ServerCard: React.FC<ServerCardProps> = ({
  server,
  serverId,
  status = ServerStatus.UNKNOWN,
  onEdit,
  onDelete,
  onCheckStatus,
}) => {
  // Get the number of environment variables
  const numEnvVars = Object.keys(server.env).length;

  // Status badge color mapping
  const getStatusColor = () => {
    switch (status) {
      case ServerStatus.ONLINE:
        return 'green';
      case ServerStatus.OFFLINE:
        return 'red';
      case ServerStatus.CHECKING:
        return 'yellow';
      default:
        return 'gray';
    }
  };

  // Status badge text
  const getStatusText = () => {
    switch (status) {
      case ServerStatus.ONLINE:
        return 'Online';
      case ServerStatus.OFFLINE:
        return 'Offline';
      case ServerStatus.CHECKING:
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <Table.Tr>
      {/* Status Badge */}
      <Table.Td>
        <Badge 
          color={getStatusColor()} 
          onClick={onCheckStatus} 
          style={{ cursor: 'pointer' }}
          title="Click to check status"
        >
          {getStatusText()}
        </Badge>
      </Table.Td>
      
      {/* ID Column */}
      <Table.Td>
        <Text fw={700} truncate>
          {serverId}
        </Text>
      </Table.Td>
      
      {/* Command Column */}
      <Table.Td>
        <Text ff="monospace" size="sm" truncate>
          {server.command}
        </Text>
      </Table.Td>
      
      {/* Args Column */}
      <Table.Td>
        {server.args.length > 0 ? (
          <Text size="sm">{server.args.length} arguments</Text>
        ) : (
          <Text size="sm" c="dimmed">No arguments</Text>
        )}
      </Table.Td>
      
      {/* Env Vars Column */}
      <Table.Td>
        {numEnvVars > 0 ? (
          <Text size="sm">{numEnvVars} {numEnvVars === 1 ? 'variable' : 'variables'}</Text>
        ) : (
          <Text size="sm" c="dimmed">No env vars</Text>
        )}
      </Table.Td>
      
      {/* Actions Column */}
      <Table.Td>
        <Group justify="flex-end" gap="xs">
          <Button 
            variant="outline" 
            size="xs" 
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            color="red" 
            size="xs" 
            onClick={onDelete}
          >
            Delete
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
};

export default ServerCard;