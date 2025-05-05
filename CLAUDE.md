# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run dev`: Run development server (Vite + Electron)
- `npm run build`: Build both frontend and Electron app
- `npm run dist`: Create distributable packages

## Test Commands

- `npm test`: Run all tests
- `npm test -- -t "test name"`: Run a specific test
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate coverage report

## Lint Commands

- `npm run lint`: Run ESLint
- `npm run lint:format`: Format code with Prettier

## Code Style Guidelines

- Use TypeScript with strict typing
- 2-space indentation, semicolons, double quotes
- PascalCase for components/interfaces, camelCase for variables/functions
- Sort imports: React first, then libraries, then local files
- Use destructured imports and path aliases (`@/`)
- Create interfaces for component props in `/types` directory
- Use functional components with hooks
- Handle errors with try/catch and provide fallbacks
- Tests should be in `__tests__` directories adjacent to tested code
- Keep components focused with clear separation of concerns
- Document complex functions with JSDoc comments
