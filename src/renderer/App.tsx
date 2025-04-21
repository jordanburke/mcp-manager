import React, { useState, useEffect } from "react"
import { AppShell, Container, Title, Group, Paper, Text, Code, Box, Loader, Stack, Button } from "@mantine/core"
import ServerManager from "./components/mcp/ServerManager"

// Declare a type for the window with electron property
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>
      }
    }
  }
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<"json" | "manager">("manager")
  const [jsonData, setJsonData] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [configPath, setConfigPath] = useState<string>("")

  // Determine the configuration path based on the operating system
  const determineConfigPath = async () => {
    try {
      // Get the platform from the main process
      const platform = await window.electron.ipcRenderer.invoke("get-platform")

      if (platform === "darwin") {
        // macOS
        setConfigPath("~/Library/Application Support/Claude/claude_desktop_config.json")
      } else if (platform === "win32") {
        // Windows
        setConfigPath("%APPDATA%\\Claude\\claude_desktop_config.json")
      } else {
        // Linux and other platforms
        setConfigPath("~/.config/Claude/claude_desktop_config.json")
      }
    } catch (error) {
      // Fallback to macOS path if there's an error
      setConfigPath("~/Library/Application Support/Claude/claude_desktop_config.json")
      console.error("Error determining platform:", error)
    }
  }

  // Call determineConfigPath when component mounts
  useEffect(() => {
    determineConfigPath()
  }, [])

  const loadJsonData = async () => {
    setIsLoading(true)
    try {
      const jsonData = await window.electron.ipcRenderer.invoke("get-mcp-config")

      // Format the JSON for better readability
      try {
        const formattedJson = JSON.stringify(JSON.parse(jsonData), null, 2)
        setJsonData(formattedJson)
        setJsonError(null)
      } catch (error) {
        // If it's not a valid JSON, show the plain text
        setJsonData(jsonData)
        setJsonError("The file does not contain valid JSON")
      }
    } catch (error: any) {
      setJsonData(null)
      setJsonError(`Error communicating with the main process: ${error?.message || "Unknown"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load JSON data when switching to JSON view
  React.useEffect(() => {
    if (activeView === "json") {
      loadJsonData()
    }
  }, [activeView])

  return (
    <AppShell header={{ height: 80 }} padding="md">
      <AppShell.Header>
        <Container size="xl" py="md">
          <Group justify="space-between" align="center">
            <Title order={1} size="h2">
              MCP Manager
            </Title>
            <Group>
              <Button
                variant={activeView === "manager" ? "default" : "outline"}
                onClick={(event) => setActiveView("manager")}
              >
                Visual Editor
              </Button>
              <Button variant={activeView === "json" ? "default" : "outline"} onClick={(event) => setActiveView("json")}>
                View JSON
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          {activeView === "manager" ? (
            <ServerManager />
          ) : (
            <Container size="lg" py="lg">
              <Stack>
                <Group justify="space-between" align="center">
                  <Title order={2} size="h3">
                    Configuration JSON File
                  </Title>
                  <Button onClick={(event) => loadJsonData()} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Reload"}
                  </Button>
                </Group>

                <Text size="sm" c="dimmed">
                  <Code>{configPath}</Code>
                </Text>

                {jsonError && (
                  <Paper p="md" withBorder radius="md" bg="red.0" c="red">
                    {jsonError}
                  </Paper>
                )}

                {isLoading ? (
                  <Box ta="center" py="xl">
                    <Loader />
                    <Text mt="md">Loading data...</Text>
                  </Box>
                ) : jsonData ? (
                  <Paper
                    p="md"
                    withBorder
                    radius="md"
                    bg="gray.0"
                    style={{
                      maxHeight: "70vh",
                      overflow: "auto",
                      whiteSpace: "pre",
                      fontFamily: "monospace",
                      fontSize: "14px",
                    }}
                  >
                    {jsonData}
                  </Paper>
                ) : (
                  <Paper p="xl" withBorder radius="md" bg="gray.0" ta="center">
                    <Text>No data available</Text>
                  </Paper>
                )}
              </Stack>
            </Container>
          )}
        </Container>
      </AppShell.Main>

      <AppShell.Footer p="md">
        <Container size="xl">
          <Text ta="center" size="sm" c="dimmed">
            MCP Manager - Manage your Model Context Protocol servers
          </Text>
        </Container>
      </AppShell.Footer>
    </AppShell>
  )
}

export default App
