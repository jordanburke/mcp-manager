import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import ImportJsonDialog from "../ImportJsonDialog"
import { MCPConfig } from "../../../types/mcp"
import { ConfigService } from "../../../services/configService"

// Mock ConfigService
vi.mock("../../../services/configService", () => ({
  ConfigService: {
    parseConfig: vi.fn(),
  },
}))

describe("ImportJsonDialog", () => {
  // Common props for tests
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should not render when isOpen is false", () => {
    const { container } = render(<ImportJsonDialog {...props} isOpen={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("should render the dialog when isOpen is true", () => {
    render(<ImportJsonDialog {...props} />)
    expect(screen.getByText("Import Servers from JSON")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeInTheDocument()
    expect(screen.getByText("Cancel")).toBeInTheDocument()
    expect(screen.getByText("Import Servers")).toBeInTheDocument()
  })

  it("should try to parse JSON when text is entered in the textarea", () => {
    // Mock the parseConfig to return a valid config
    const mockConfig: MCPConfig = {
      mcpServers: {
        test: {
          command: "echo",
          args: ["test"],
          env: {},
        },
      },
    }
    vi.mocked(ConfigService.parseConfig).mockReturnValue(mockConfig)

    render(<ImportJsonDialog {...props} />)

    // Get and fill the textarea
    const textarea = screen.getByRole("textbox")
    const validJson = JSON.stringify({
      mcpServers: {
        test: {
          command: "echo",
          args: ["test"],
          env: {},
        },
      },
    })

    fireEvent.change(textarea, { target: { value: validJson } })

    // Expect parseConfig to be called with the entered text
    expect(ConfigService.parseConfig).toHaveBeenCalledWith(validJson)

    // Should show success message with server count
    expect(screen.getByText(/Valid configuration detected with 1 server/)).toBeInTheDocument()
  })

  it("should show an error message when invalid JSON is entered", () => {
    // Mock the parseConfig to throw an error
    vi.mocked(ConfigService.parseConfig).mockImplementation(() => {
      throw new Error("Invalid JSON")
    })

    render(<ImportJsonDialog {...props} />)

    // Get and fill the textarea with invalid JSON
    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, { target: { value: "not valid json" } })

    // Should show error message
    expect(screen.getByText(/Error parsing JSON/)).toBeInTheDocument()
  })

  it("should call onImport with parsed config when Import Servers button is clicked", () => {
    // Mock the parseConfig to return a valid config
    const mockConfig: MCPConfig = {
      mcpServers: {
        test: {
          command: "echo",
          args: ["test"],
          env: {},
        },
      },
    }
    vi.mocked(ConfigService.parseConfig).mockReturnValue(mockConfig)

    render(<ImportJsonDialog {...props} />)

    // Get and fill the textarea
    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, {
      target: { value: '{"mcpServers":{"test":{"command":"echo","args":["test"],"env":{}}}}' },
    })

    // Click the import button
    const importButton = screen.getByText("Import Servers")
    fireEvent.click(importButton)

    // Expect onImport to be called with the parsed config
    expect(props.onImport).toHaveBeenCalledWith(mockConfig)
  })

  it("should call onClose when Cancel button is clicked", () => {
    render(<ImportJsonDialog {...props} />)

    // Click the cancel button
    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    // Expect onClose to be called
    expect(props.onClose).toHaveBeenCalled()
  })

  it("should disable the Import Servers button when there is no valid config", () => {
    render(<ImportJsonDialog {...props} />)

    // The Import Servers button should be disabled initially
    const importButton = screen.getByText("Import Servers")
    expect(importButton).toBeDisabled()

    // When there is an error, the button should remain disabled
    vi.mocked(ConfigService.parseConfig).mockImplementation(() => {
      throw new Error("Invalid JSON")
    })

    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, { target: { value: "not valid json" } })

    expect(importButton).toBeDisabled()
  })

  it("should show plural text for multiple servers", () => {
    // Mock the parseConfig to return a config with multiple servers
    const mockConfig: MCPConfig = {
      mcpServers: {
        test1: {
          command: "echo",
          args: ["test1"],
          env: {},
        },
        test2: {
          command: "echo",
          args: ["test2"],
          env: {},
        },
      },
    }
    vi.mocked(ConfigService.parseConfig).mockReturnValue(mockConfig)

    render(<ImportJsonDialog {...props} />)

    // Get and fill the textarea
    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, { target: { value: JSON.stringify(mockConfig) } })

    // Should show success message with plural form
    expect(screen.getByText(/Valid configuration detected with 2 servers/)).toBeInTheDocument()
  })
})
