/// <reference types="vitest" />
import "@testing-library/jest-dom"

declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): T
    toBeEmptyDOMElement(): T
    toBeDisabled(): T
    // Add other matchers as needed
  }
}
