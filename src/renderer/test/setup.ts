import "@testing-library/jest-dom"
import { vi } from "vitest"

// No need to explicitly extend matchers as they are automatically added by the import

// Mock window.matchMedia - required by Mantine
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Suppress console errors for tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out common React/Mantine warnings
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('MantineProvider') || 
     args[0].includes('validateDOMNesting') ||
     args[0].includes('Error:') ||
     args[0].includes('component tree'))
  ) {
    return;
  }
  
  // Pass through other console errors
  originalConsoleError(...args);
};

// Mock window.electron for tests
Object.defineProperty(window, "electron", {
  value: {
    ipcRenderer: {
      invoke: vi.fn(),
    },
  },
  writable: true,
})

// Mock ResizeObserver which is used by Mantine
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
