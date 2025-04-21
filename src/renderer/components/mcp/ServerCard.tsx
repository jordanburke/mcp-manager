import React from "react"
import { Table, Badge, Group, Button, Text, ActionIcon, Tooltip, Code } from "@mantine/core"
import { IconEdit, IconTrash, IconRefresh } from "@tabler/icons-react"
import { MCPServer, ServerStatus } from "@/types/mcp"

interface ServerCardProps {
  server: MCPServer
  serverId: string
  status?: ServerStatus
  onEdit: () => void
  onDelete: () => void
  onCheckStatus: () => void
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
  const numEnvVars = Object.keys(server.env).length

  // Status badge color mapping
  const getStatusColor = () => {
    switch (status) {
      case ServerStatus.ONLINE:
        return "green"
      case ServerStatus.OFFLINE:
        return "red"
      case ServerStatus.CHECKING:
        return "yellow"
      default:
        return "gray"
    }
  }

  // Status badge text
  const getStatusText = () => {
    switch (status) {
      case ServerStatus.ONLINE:
        return "Online"
      case ServerStatus.OFFLINE:
        return "Offline"
      case ServerStatus.CHECKING:
        return "Checking..."
      default:
        return "Unknown"
    }
  }

  // Status badge variant
  const getStatusVariant = () => {
    return status === ServerStatus.ONLINE ? "filled" : "light"
  }

  return (
    <Table.Tr style={{ transition: "background-color 0.2s ease" }}>
      {/* Status Badge */}
      <Table.Td>
        <Tooltip label="Click to check status">
          <Badge
            color={getStatusColor()}
            onClick={onCheckStatus}
            style={{ cursor: "pointer" }}
            variant={getStatusVariant()}
            size="md"
            radius="sm"
          >
            {getStatusText()}
          </Badge>
        </Tooltip>
      </Table.Td>

      {/* ID Column */}
      <Table.Td>
        <Text fw={600} truncate>
          {serverId}
        </Text>
      </Table.Td>

      {/* Command Column */}
      <Table.Td>
        <Code style={{ padding: "4px 8px", borderRadius: "4px" }}>{server.command}</Code>
      </Table.Td>

      {/* Args Column */}
      <Table.Td>
        {server.args.length > 0 ? (
          <Tooltip label={server.args.join(" ")} multiline w={300} withArrow disabled={server.args.length === 0}>
            <Badge variant="dot" color="blue" size="sm">
              {server.args.length} {server.args.length === 1 ? "argument" : "arguments"}
            </Badge>
          </Tooltip>
        ) : (
          <Text size="sm" c="dimmed">
            No arguments
          </Text>
        )}
      </Table.Td>

      {/* Env Vars Column */}
      <Table.Td>
        {numEnvVars > 0 ? (
          <Tooltip
            label={Object.entries(server.env)
              .map(([key, value]) => `${key}=${value}`)
              .join("\n")}
            multiline
            w={300}
            withArrow
            disabled={numEnvVars === 0}
          >
            <Badge variant="dot" color="teal" size="sm">
              {numEnvVars} {numEnvVars === 1 ? "variable" : "variables"}
            </Badge>
          </Tooltip>
        ) : (
          <Text size="sm" c="dimmed">
            No env vars
          </Text>
        )}
      </Table.Td>

      {/* Actions Column */}
      <Table.Td>
        <Group justify="flex-end" gap="xs">
          <Tooltip label="Check status">
            <ActionIcon variant="light" color="blue" onClick={onCheckStatus} radius="md" size="sm">
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Edit server">
            <ActionIcon variant="light" color="blue" onClick={onEdit} radius="md" size="sm">
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete server">
            <ActionIcon variant="light" color="red" onClick={onDelete} radius="md" size="sm">
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}

export default ServerCard
