import type {
  WebMCPRegistrationOptions,
  WebMCPRuntimeProfile,
  WebMCPToolDefinition,
} from '../index.js';

export interface ChromeLegacyWebMCPDocument {
  readonly modelContext?: {
    registerTool(
      tool: WebMCPToolDefinition,
      options?: WebMCPRegistrationOptions,
    ): void;
  };
}

/**
 * Chrome's earlier public demos allowed `registerTool` to return `void`.
 * Keep that API variance in this profile instead of widening the canonical
 * manager or every consumer of the current profile.
 */
export const chromeLegacyWebMCPProfile: WebMCPRuntimeProfile<ChromeLegacyWebMCPDocument> = {
  id: 'chrome-legacy',
  isSupported(document): document is ChromeLegacyWebMCPDocument {
    return typeof (document as ChromeLegacyWebMCPDocument | undefined)?.modelContext?.registerTool === 'function';
  },
  async registerTool(document, tool, options): Promise<void> {
    const registerTool = document.modelContext?.registerTool;
    if (!registerTool) throw new Error('Chrome legacy WebMCP modelContext is unavailable.');
    await registerTool(tool, options);
  },
};
