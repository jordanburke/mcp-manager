import React, { useState, useEffect } from "react"
import {
  AppShell,
  Container,
  Title,
  Group,
  Paper,
  Text,
  Code,
  Box,
  Loader,
  Stack,
  Button,
  SegmentedControl,
  useMantineColorScheme,
  rem,
  Transition,
  Flex
} from "@mantine/core"
import ServerManager from "./components/mcp/ServerManager"
import {MantineColorScheme} from "@mantine/core/lib/core/MantineProvider/theme.types";
import { IconServer, IconCode } from '@tabler/icons-react';

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
  const { setColorScheme, colorScheme } = useMantineColorScheme()

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
    <AppShell
      header={{ height: 70 }}
      padding="md"
      styles={(theme) => ({
        main: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      })}
    >
      <AppShell.Header
        style={{
          background: colorScheme === 'dark'
            ? 'linear-gradient(to right, #1A1B1E, #25262b)'
            : 'linear-gradient(to right, #f8f9fa, #e9ecef)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Container size="xl" h="100%">
          <Flex justify="space-between" align="center" h="100%">
            <Group>
              <Title order={1} size="h3" style={{ letterSpacing: '-0.5px' }}>
                MCP Manager
              </Title>
            </Group>

            <Group>
              <SegmentedControl
                value={colorScheme}
                onChange={(value: string) => setColorScheme(value as MantineColorScheme)}
                data={[
                  { value: 'light', label: 'Light' },
                  { value: 'auto', label: 'System' },
                  { value: 'dark', label: 'Dark' },
                ]}
                size="xs"
                radius="md"
              />
              <Group gap="xs">
                <Button
                  variant={activeView === "manager" ? "filled" : "subtle"}
                  onClick={() => setActiveView("manager")}
                  leftSection={<IconServer size={16} />}
                  radius="md"
                  size="sm"
                >
                  Visual Editor
                </Button>
                <Button
                  variant={activeView === "json" ? "filled" : "subtle"}
                  onClick={() => setActiveView("json")}
                  leftSection={<IconCode size={16} />}
                  radius="md"
                  size="sm"
                >
                  View JSON
                </Button>
              </Group>
            </Group>
          </Flex>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" py="md">
          <Transition
            mounted={activeView === "manager"}
            transition="fade"
            duration={200}
          >
            {(styles) => (
              <div style={{ ...styles, display: activeView === "manager" ? 'block' : 'none' }}>
                <ServerManager />
              </div>
            )}
          </Transition>

          <Transition
            mounted={activeView === "json"}
            transition="fade"
            duration={200}
          >
            {(styles) => (
              <div style={{ ...styles, display: activeView === "json" ? 'block' : 'none' }}>
                <Container size="lg" py="lg">
                  <Stack>
                    <Group justify="space-between" align="center">
                      <Title order={2} size="h4">
                        Configuration JSON File
                      </Title>
                      <Button
                        onClick={loadJsonData}
                        disabled={isLoading}
                        variant="light"
                        radius="md"
                        size="sm"
                      >
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
                        shadow="sm"
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
                      <Paper p="xl" withBorder radius="md" ta="center" shadow="sm">
                        <Text>No data available</Text>
                      </Paper>
                    )}
                  </Stack>
                </Container>
              </div>
            )}
          </Transition>
        </Container>
      </AppShell.Main>

      <AppShell.Footer
        p="md"
        h={50}
        style={{
          borderTop: '1px solid',
          borderColor: colorScheme === 'dark' ? '#2C2E33' : '#e9ecef',
        }}
      >
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
