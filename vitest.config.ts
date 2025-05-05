import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/renderer/test/setup.ts"],
    server: {
      deps: {
        inline: ["@mantine/core", "@mantine/hooks"]
      }
    },
    reporters: ['default'],
    testTimeout: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/renderer"),
    },
  },
})
