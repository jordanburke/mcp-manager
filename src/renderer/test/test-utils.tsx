import React, { ReactElement } from "react"
import { render, RenderOptions } from "@testing-library/react"
import { MantineProvider, createTheme } from "@mantine/core"

// Create test theme
const theme = createTheme({
  primaryColor: "blue",
})

// Custom render function that wraps components with MantineProvider
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, {
    wrapper: ({ children }) => (
      <MantineProvider theme={theme} defaultColorScheme="light">
        {children}
      </MantineProvider>
    ),
    ...options,
  })

// Re-export everything from testing-library
export * from "@testing-library/react"

// Override render method
export { customRender as render }
