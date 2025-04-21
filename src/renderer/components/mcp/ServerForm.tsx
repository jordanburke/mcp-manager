import React, { useState } from "react"
import { TextInput, Button, Stack, Group, Text, Badge, Box, Grid } from "@mantine/core"
import { MCPServer, EditableMCPServer } from "@/types/mcp"
import { v4 as uuidv4 } from "uuid"

interface ServerFormProps {
  onSubmit: (server: EditableMCPServer) => void
  onCancel: () => void
  server?: MCPServer
  serverId?: string
}

const ServerForm: React.FC<ServerFormProps> = ({ onSubmit, onCancel, server, serverId }) => {
  const [formData, setFormData] = useState<EditableMCPServer>({
    id: serverId || uuidv4(),
    command: server?.command || "",
    args: server?.args || [],
    env: server?.env || {},
  })

  const [serverName, setServerName] = useState(() => {
    console.log(`Initializing server form with serverId: "${serverId || "none"}"`)
    return serverId || ""
  })
  const [newArg, setNewArg] = useState("")
  const [newEnvKey, setNewEnvKey] = useState("")
  const [newEnvValue, setNewEnvValue] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * Handles changes to the server name input field
   * Updates both the serverName state and the server ID
   * @param value New server name value
   */
  const handleNameChange = (value: string) => {
    console.log(`Server name changed to: "${value}"`)

    // Update the serverName state
    setServerName(value)

    // Update the server ID in the form data
    setFormData((prev) => {
      const updated = { ...prev, id: value || uuidv4() }
      console.log(`Updated form data ID: "${updated.id}"`)
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalFormData = { ...formData }
    // Ensure the ID is set to the server name (or fallback to UUID)
    finalFormData.id = serverName || uuidv4()
    onSubmit(finalFormData)
  }

  /**
   * Adds a new argument to the server configuration
   * Uses early return pattern for cleaner code
   */
  const addArg = () => {
    const trimmedArg = newArg.trim()

    if (!trimmedArg) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      args: [...prev.args, trimmedArg],
    }))

    setNewArg("")
  }

  /**
   * Handles keyboard events for the argument input
   * Prevents form submission and adds argument when Enter is pressed
   * @param e Keyboard event
   */
  const handleArgKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add argument when Enter key is pressed
    if (e.key === "Enter") {
      e.preventDefault()
      addArg()
    }
  }

  /**
   * Removes an argument from the server configuration by index
   * @param index The position of the argument to remove
   */
  const removeArg = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      args: prev.args.filter((_, i) => i !== index),
    }))
  }

  /**
   * Adds a new environment variable to the server configuration
   * Uses early return pattern for cleaner code
   */
  const addEnvVariable = () => {
    const trimmedKey = newEnvKey.trim()
    const trimmedValue = newEnvValue.trim()

    if (!trimmedKey || !trimmedValue) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      env: {
        ...prev.env,
        [trimmedKey]: trimmedValue,
      },
    }))

    setNewEnvKey("")
    setNewEnvValue("")
  }

  /**
   * Handles keyboard events for environment variable inputs
   * Prevents form submission and adds environment variable when Enter is pressed
   * @param e Keyboard event
   */
  const handleEnvKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add environment variable when Enter key is pressed
    if (e.key === "Enter") {
      e.preventDefault()
      addEnvVariable()
    }
  }

  /**
   * Removes an environment variable from the server configuration by key
   * @param key The key of the environment variable to remove
   */
  const removeEnvVariable = (key: string) => {
    const newEnv = { ...formData.env }
    delete newEnv[key]
    setFormData((prev) => ({
      ...prev,
      env: newEnv,
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Server Name"
          description="This name will be used as the server identifier"
          placeholder="Enter a unique name for this server"
          value={serverName}
          onChange={(event) => handleNameChange(event.currentTarget.value)}
          required
          size="sm"
        />

        <TextInput
          label="Command"
          placeholder="Enter command (e.g., npm run start)"
          name="command"
          value={formData.command}
          onChange={handleChange}
          required
          size="sm"
        />

        <Box>
          <Text fw={500} size="sm" mb={5}>
            Arguments
          </Text>
          <Group align="flex-end" mb="xs">
            <TextInput
              placeholder="Add an argument"
              value={newArg}
              onChange={(event) => setNewArg(event.currentTarget.value)}
              onKeyDown={handleArgKeyPress}
              style={{ flex: 1 }}
              size="sm"
            />
            <Button size="xs" onClick={addArg}>
              Add
            </Button>
          </Group>

          {formData.args.length > 0 && (
            <Stack gap="xs" mt="xs">
              {formData.args.map((arg, index) => (
                <Group key={index} justify="space-between" wrap="nowrap">
                  <Badge size="lg" radius="sm" py={12} style={{ flex: 1, textAlign: "left" }}>
                    {arg}
                  </Badge>
                  <Button variant="subtle" color="gray" size="xs" onClick={() => removeArg(index)}>
                    Remove
                  </Button>
                </Group>
              ))}
            </Stack>
          )}
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={5}>
            Environment Variables
          </Text>
          <Grid mb="xs">
            <Grid.Col span={6}>
              <TextInput
                placeholder="Key"
                value={newEnvKey}
                onChange={(event) => setNewEnvKey(event.currentTarget.value)}
                onKeyDown={handleEnvKeyPress}
                size="sm"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                placeholder="Value"
                value={newEnvValue}
                onChange={(event) => setNewEnvValue(event.currentTarget.value)}
                onKeyDown={handleEnvKeyPress}
                size="sm"
              />
            </Grid.Col>
          </Grid>

          <Button size="xs" onClick={addEnvVariable} mb="xs">
            Add Variable
          </Button>

          {Object.keys(formData.env).length > 0 && (
            <Stack gap="xs" mt="xs">
              {Object.entries(formData.env).map(([key, value]) => (
                <Group key={key} justify="space-between" wrap="nowrap">
                  <Badge size="lg" radius="sm" py={12} style={{ flex: 1, textAlign: "left" }}>
                    <Text span fw={600}>
                      {key}
                    </Text>
                    : {value}
                  </Badge>
                  <Button variant="subtle" color="gray" size="xs" onClick={() => removeEnvVariable(key)}>
                    Remove
                  </Button>
                </Group>
              ))}
            </Stack>
          )}
        </Box>

        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{server ? "Update" : "Add"} Server</Button>
        </Group>
      </Stack>
    </form>
  )
}

export default ServerForm
