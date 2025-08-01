# Gemini-AI Agent Project Context

This document provides the necessary context for the Gemini-AI agent to understand and work with the `context-action` project.

## Project Overview

`context-action` is a JavaScript/TypeScript framework for managing application state and business logic in a structured and scalable way. It is built around a central "Action Pipeline" system that processes dispatched actions through a series of handlers. The project emphasizes a clear separation of concerns, following patterns similar to MVVM.

The project is a monorepo managed with pnpm workspaces, containing the core framework, packages for different environments (like React), and a comprehensive documentation and example suite.

## Development Workflow

The project follows a strict, documentation-driven development workflow:

1.  **System Architecture Design (`docs/ko/guide/architecture.md`):** Define the core architectural concepts.
2.  **Glossary Specification (`glossary/terms/`):** Create implementation-neutral definitions for all core concepts. This is the single source of truth for terminology.
3.  **Glossary-to-Code Linking (JSDoc):** Connect the abstract glossary terms to the concrete code implementation using `@implements` and `@memberof` JSDoc tags.
4.  **API Implementation (`packages/`):** Write the actual code in the respective packages.
5.  **API Documentation (`docs/api/`):** Document the technical details of the API.
6.  **Usage Guides (`docs/example/`):** Write user-friendly guides and recipes.
7.  **Examples & Tests (`example/`):** Provide working examples that also serve as integration tests.

## Glossary System

A key feature of this project is the **Glossary System**, which ensures consistency between documentation and code.

*   **Location:** The core logic is in the `@context-action/glossary` package. Configuration is in `glossary.config.js`.
*   **Purpose:** To scan the codebase for special JSDoc tags (`@implements`, `@memberof`) and automatically generate a mapping between the conceptual glossary and the actual implementation.
*   **JSDoc Tags:**
    *   `@implements <term-name>`: Links a piece of code (class, function, type) to a glossary term. The term name must be in `kebab-case`. (e.g., `@implements action-handler`). **This is mandatory for linking.**
    *   `@memberof <category>`: Assigns the term to a category (e.g., `core-concepts`, `api-terms`). **This is mandatory for linking.**
*   **Tooling:** The project has a set of scripts to manage the glossary system. The main command is:
    ```bash
    # Scans code, validates mappings, analyzes missing links, and generates a dashboard.
    pnpm glossary:update
    ```
*   **Outputs:** The tools generate several files in `docs/implementations/` that report on the status of the glossary-to-code mapping, including `dashboard.md`.

## How to Work with this Project

1.  **Understand the Core Concepts:** Before making changes, review `docs/ko/guide/architecture.md` and the glossary terms in `glossary/terms/`.
2.  **Follow the Workflow:** When adding a new feature or changing an existing one, adhere to the development workflow.
3.  **Link Your Code:** If you implement a concept from the glossary, you **must** add the appropriate `@implements` and `@memberof` JSDoc tags to your code.
4.  **Verify Your Changes:** After making changes, run `pnpm glossary:update` to ensure your code is correctly linked and documented. Also run the standard project checks like `pnpm type-check` and `pnpm test`.
5.  **Keep Documentation Consistent:** If you change an API, update the corresponding API docs and usage guides.

By following these guidelines, you will help maintain the project's high standards of quality, consistency, and traceability.
