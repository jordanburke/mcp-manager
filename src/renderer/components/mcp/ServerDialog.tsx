import React from 'react';
import { Modal, Title, Text } from '@mantine/core';
import { MCPServer, EditableMCPServer } from '../../types/mcp';
import ServerForm from './ServerForm';

interface ServerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (server: EditableMCPServer) => void;
  server?: MCPServer;
  serverId?: string;
  title: string;
}

const ServerDialog: React.FC<ServerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  server,
  serverId,
  title,
}) => {
  return (
    <Modal 
      opened={isOpen} 
      onClose={onClose} 
      title={<Title order={3}>{title}</Title>}
      size="md"
      centered
      overlayProps={{
        opacity: 0.55,
        blur: 3,
      }}
      padding="md"
    >
      {/* Note about editing the server name */}
      {server && (
        <Text size="sm" color="dimmed" mb="md">
          You can change the server identifier by updating the Server Name field.
        </Text>
      )}
      
      <ServerForm
        server={server}
        serverId={serverId}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default ServerDialog;
