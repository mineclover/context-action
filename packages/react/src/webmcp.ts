/**
 * Experimental React integration for the browser-only WebMCP adapter.
 *
 * This module intentionally has its own public subpath. The source-only
 * ToolContext development track is excluded from React 3 artifacts, so
 * installed-package consumers opt into this experimental adapter explicitly.
 */

export { useWebMCPToolScope } from './tools/useWebMCPToolScope';
export type { WebMCPToolScopeState } from './tools/useWebMCPToolScope';
