import React from "react"
import { Modal, Title, Text, Group, Button } from "@mantine/core"

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  serverName: string
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ isOpen, onClose, onConfirm, serverName }) => {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Title order={3}>Delete Server</Title>}
      size="sm"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      padding="md"
    >
      <Text mb="lg">
        Are you sure you want to delete the server{" "}
        <Text span fw={600}>
          {serverName}
        </Text>
        ? This action cannot be undone.
      </Text>

      <Group justify="flex-end" gap="sm">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm}>
          Delete
        </Button>
      </Group>
    </Modal>
  )
}

export default DeleteConfirmDialog
