import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';

// No need to explicitly extend matchers as they are automatically added by the import

// Mock de window.electron para los tests
Object.defineProperty(window, 'electron', {
  value: {
    ipcRenderer: {
      invoke: vi.fn()
    }
  },
  writable: true
}); 
