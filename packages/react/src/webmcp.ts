/**
 * Experimental React integration for the browser-only WebMCP adapter.
 *
 * This module intentionally has its own public subpath. It accepts any
 * ToolManagementInterface registry, so installed-package consumers do not
 * need the source-only ToolContext development track to opt in explicitly.
 */

export { useWebMCPToolScope } from './tools/useWebMCPToolScope';
export type { WebMCPToolScopeState } from './tools/useWebMCPToolScope';
