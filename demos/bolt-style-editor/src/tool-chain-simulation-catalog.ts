import type { ToolCall } from './local-agent-plan';

export type ToolChainSimulationStep = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly call: ToolCall;
};

export type ToolChainSimulationSnapshot = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly sourceRecipeId: string;
  readonly protocol: readonly [
    'tools/list',
    'model tool call',
    'tools/call',
    'tool result',
  ];
  readonly steps: readonly ToolChainSimulationStep[];
};

/**
 * A captured, deterministic tool-chain reference for the standalone demo.
 *
 * The snapshot documents the request lifecycle while its calls remain typed
 * ToolCall values. The simulation runner executes these calls through the
 * same direct Context-Action registry path as the visible tool palette.
 */
export const standaloneToolChainSimulationSnapshots = [
  {
    id: 'emerald-preview-pass',
    title: 'Emerald preview pass',
    description:
      'Inspect the workspace, apply a visual theme, verify the preview, and remount the sandbox.',
    sourceRecipeId: 'make-emerald',
    protocol: ['tools/list', 'model tool call', 'tools/call', 'tool result'],
    steps: [
      {
        id: 'inspect-workspace',
        label: 'Inspect workspace',
        description: 'Read the current revision before the visual mutation.',
        call: { name: 'workspace.getStatus', arguments: {} },
      },
      {
        id: 'apply-emerald-theme',
        label: 'Apply emerald theme',
        description: 'Use the typed preview contract to update CSS tokens.',
        call: {
          name: 'preview.setTheme',
          arguments: { theme: 'emerald' },
        },
      },
      {
        id: 'verify-preview',
        label: 'Verify preview status',
        description: 'Read iframe status and bounded diagnostics.',
        call: { name: 'preview.getStatus', arguments: {} },
      },
      {
        id: 'refresh-sandbox',
        label: 'Refresh sandbox',
        description: 'Remount the iframe and wait for acknowledgement.',
        call: { name: 'preview.refresh', arguments: {} },
      },
    ],
  },
] satisfies readonly ToolChainSimulationSnapshot[];
