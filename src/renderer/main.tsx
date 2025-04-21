import React from "react"
import ReactDOM from "react-dom/client"
import { MantineProvider, createTheme } from "@mantine/core"
import App from "./App"
import "./styles/globals.css"
import "@mantine/core/styles.css"

// Ensure Electron's IPC is available in the renderer context
// @ts-ignore
window.electron = window.electron || { ipcRenderer: require("electron").ipcRenderer }

// Create Mantine theme
const theme = createTheme({
  // You can customize your theme here
  primaryColor: "blue",
  // Add more customizations as needed
})

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </React.StrictMode>,
)
