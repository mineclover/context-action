import {
  type ToolCallResult,
  type ToolRegistry,
  toToolListRequest,
} from '@context-action/react';
import type { UIToolsActions } from './ui-tools-schema';

export interface LocalUIToolchainResult {
  readonly listedToolNames: readonly string[];
  readonly executedToolNames: readonly string[];
  readonly results: readonly ToolCallResult[];
}

const LOCAL_UI_TOOLCHAIN: readonly {
  readonly name: keyof UIToolsActions & string;
  readonly arguments: Record<string, unknown>;
}[] = [
  {
    name: 'getUiState',
    arguments: { fields: ['theme', 'counter', 'heading'] },
  },
  {
    name: 'updateCounter',
    arguments: { amount: 3 },
  },
  {
    name: 'updateHeading',
    arguments: { text: 'MCP function calling 성공' },
  },
];

/**
 * Run the catalog's deterministic UI recipe without a provider credential.
 *
 * Discovery still uses the canonical paged tools/list boundary, and every
 * planned call uses executeModelToolCall so local and provider execution share
 * validation, lifecycle, and structured result behavior.
 */
export async function runLocalUIToolchain(
  registry: ToolRegistry<UIToolsActions>,
  sessionId: string
): Promise<LocalUIToolchainResult> {
  const listedToolNames: string[] = [];
  let page = registry.listTools(toToolListRequest());
  listedToolNames.push(...page.tools.map((tool) => tool.name));

  while (page.nextCursor) {
    page = registry.listTools(toToolListRequest({ cursor: page.nextCursor }));
    listedToolNames.push(...page.tools.map((tool) => tool.name));
  }

  const availableToolNames = new Set(listedToolNames);
  const missingToolNames = LOCAL_UI_TOOLCHAIN.filter(
    ({ name }) => !availableToolNames.has(name)
  ).map(({ name }) => name);
  if (missingToolNames.length > 0) {
    throw new Error(
      `Offline UI toolchain is missing registered tools: ${missingToolNames.join(', ')}`
    );
  }

  const results: ToolCallResult[] = [];
  const executedToolNames: string[] = [];
  for (const [index, call] of LOCAL_UI_TOOLCHAIN.entries()) {
    const result = await registry.executeModelToolCall(
      {
        id: `${sessionId}:${index + 1}`,
        name: call.name,
        arguments: call.arguments,
      },
      { context: { source: 'local', sessionId } }
    );
    results.push(result);
    executedToolNames.push(call.name);
    if (result.isError) break;
  }

  return {
    listedToolNames,
    executedToolNames,
    results,
  };
}
