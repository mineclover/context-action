import type {
  WebMCPDocument,
  WebMCPRegistrationOptions,
  WebMCPRuntimeProfile,
  WebMCPToolDefinition,
} from '../index.js';

/**
 * Chrome's earlier public demos allowed `registerTool` to return `void`.
 * Keep that API variance in this profile instead of widening the canonical
 * manager or every consumer of the current profile.
 */
export const chromeLegacyWebMCPProfile: WebMCPRuntimeProfile = {
  id: 'chrome-legacy',
  isSupported(document): boolean {
    return typeof (document as WebMCPDocument | undefined)?.modelContext?.registerTool === 'function';
  },
  async registerTool(document, tool, options): Promise<void> {
    const registerTool = (document as WebMCPDocument | undefined)?.modelContext?.registerTool;
    if (!registerTool) throw new Error('Chrome legacy WebMCP modelContext is unavailable.');
    await registerTool(tool, options);
  },
};
