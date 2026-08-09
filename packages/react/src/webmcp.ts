/**
 * Experimental React integration for the browser-only WebMCP adapter.
 *
 * This module intentionally has its own public subpath. Stable ToolContext
 * consumers import from `@context-action/react/tools` and never acquire a
 * WebMCP compatibility promise merely by using that API.
 */

export { useWebMCPToolScope } from './tools/useWebMCPToolScope';
export type { WebMCPToolScopeState } from './tools/useWebMCPToolScope';
