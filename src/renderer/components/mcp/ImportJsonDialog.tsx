import React, { useState, ChangeEvent } from "react"
import { Modal, Title, Text, Textarea, Alert, Group, Button } from "@mantine/core"
import { MCPConfig } from "@/types/mcp"
import { ConfigService } from "@/services/configService"

interface ImportJsonDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (config: MCPConfig) => void
}

const ImportJsonDialog: React.FC<ImportJsonDialogProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonText, setJsonText] = useState<string>("")
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedConfig, setParsedConfig] = useState<MCPConfig | null>(null)

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setJsonText(value)

    try {
      // Try to parse the JSON
      const config = ConfigService.parseConfig(value)
      setParseError(null)
      setParsedConfig(config)
    } catch (error: any) {
      setParseError(`Error parsing JSON: ${error.message}`)
      setParsedConfig(null)
    }
  }

  const handleImport = () => {
    if (parsedConfig) {
      onImport(parsedConfig)
    }
  }

  // Count the number of servers in the parsed config
  const serverCount = parsedConfig ? Object.keys(parsedConfig.mcpServers).length : 0

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Text size="md" fw={500}>Import Servers from JSON</Text>}
      size="lg"
      centered
      overlayProps={{
        opacity: 0.55,
        blur: 3,
      }}
      padding="md"
    >
      <Text size="sm" color="dimmed" mb="md">
        Paste a valid MCP configuration JSON in the text area below.
      </Text>

      <Textarea
        value={jsonText}
        onChange={handleTextChange}
        placeholder={
          '{\n  "mcpServers": {\n    "server-id": {\n      "command": "command",\n      "args": [],\n      "env": {}\n    }\n  }\n}'
        }
        minRows={8}
        maxRows={12}
        autosize
        mb="md"
        styles={{
          input: {
            fontFamily: "monospace",
          },
        }}
      />

      {parseError && (
        <Alert color="red" title="Parse Error" mb="md">
          {parseError}
        </Alert>
      )}

      {parsedConfig && !parseError && (
        <Alert color="green" title="Valid Configuration" mb="md">
          Valid configuration detected with {serverCount} server{serverCount !== 1 ? "s" : ""}
        </Alert>
      )}

      <Group justify="flex-end" gap="sm" mt="md">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!parsedConfig || !!parseError}>
          Import Servers
        </Button>
      </Group>
    </Modal>
  )
}

export default ImportJsonDialog
