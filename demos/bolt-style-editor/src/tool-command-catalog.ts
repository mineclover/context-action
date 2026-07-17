import type { BoltStyleToolSchema } from './tool-schema';

export type StandaloneToolName = keyof BoltStyleToolSchema & string;

export type ToolChainRecipe = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly prompt: string;
  readonly tools: readonly StandaloneToolName[];
  readonly expectedChain: readonly string[];
};

/**
 * Prompts shown beside the standalone composer.
 *
 * Keeping the prompt, tool names, and expected lifecycle together makes the
 * UI a small executable catalog instead of a second, untyped list of sample
 * strings. The local agent and OpenRouter agent still own planning/execution;
 * these recipes only provide discoverable inputs and their expected chain.
 */
export const standaloneToolChainRecipes = [
  {
    id: 'make-emerald',
    title: 'Make it emerald',
    description: 'Read workspace state, then change the preview theme.',
    prompt: 'Make it emerald',
    tools: ['workspace.getStatus', 'preview.setTheme'],
    expectedChain: [
      'workspace.getStatus',
      'preview.setTheme',
      'iframe acknowledgement',
    ],
  },
  {
    id: 'add-feature-card',
    title: 'Add a feature card',
    description: 'Use a semantic preview tool to add a new landing-page card.',
    prompt: 'Add a feature card',
    tools: ['workspace.getStatus', 'preview.addFeature'],
    expectedChain: [
      'workspace.getStatus',
      'preview.addFeature',
      'iframe acknowledgement',
    ],
  },
  {
    id: 'update-hero',
    title: 'Update the hero',
    description: 'Update hero copy through the typed preview contract.',
    prompt: 'Update the hero',
    tools: ['workspace.getStatus', 'preview.updateHero'],
    expectedChain: [
      'workspace.getStatus',
      'preview.updateHero',
      'iframe acknowledgement',
    ],
  },
  {
    id: 'show-workspace-status',
    title: 'Show workspace status',
    description: 'Run a read-only tools/call without changing the workspace.',
    prompt: 'Show workspace status',
    tools: ['workspace.getStatus'],
    expectedChain: ['workspace.getStatus'],
  },
  {
    id: 'show-preview-status',
    title: 'Show preview status',
    description:
      'Read iframe revision, runtime status, and bounded preview diagnostics.',
    prompt: 'Show preview status',
    tools: ['preview.getStatus'],
    expectedChain: ['preview.getStatus'],
  },
  {
    id: 'refresh-preview',
    title: 'Refresh preview',
    description:
      'Preflight the workspace, then remount the sandbox and await acknowledgement.',
    prompt: 'Refresh the preview',
    tools: ['workspace.getStatus', 'preview.refresh'],
    expectedChain: [
      'workspace.getStatus',
      'preview.refresh',
      'iframe acknowledgement',
    ],
  },
  {
    id: 'create-notes',
    title: 'Create notes.md',
    description: 'Create a text file and wait for the preview boundary.',
    prompt: 'Create notes.md',
    tools: ['workspace.getStatus', 'workspace.createFile'],
    expectedChain: [
      'workspace.getStatus',
      'workspace.createFile',
      'iframe acknowledgement',
    ],
  },
  {
    id: 'rename-index',
    title: 'Rename index.html to landing.html',
    description:
      'List the workspace before applying a revision-guarded rename.',
    prompt: 'Rename index.html to landing.html',
    tools: [
      'workspace.getStatus',
      'workspace.listFiles',
      'workspace.renameFile',
    ],
    expectedChain: [
      'workspace.getStatus',
      'workspace.listFiles',
      'workspace.renameFile',
      'iframe acknowledgement',
    ],
  },
  {
    id: 'undo-latest-edit',
    title: 'Undo latest edit',
    description:
      'Read the current workspace before applying a revision-guarded undo.',
    prompt: 'Undo latest edit',
    tools: ['workspace.getStatus', 'workspace.undo'],
    expectedChain: [
      'workspace.getStatus',
      'workspace.undo',
      'iframe acknowledgement',
    ],
  },
  {
    id: 'download-current-file',
    title: 'Download current file',
    description:
      'Inspect the workspace before crossing the download approval boundary.',
    prompt: 'Download current file',
    tools: [
      'workspace.getStatus',
      'workspace.listFiles',
      'workspace.downloadFile',
    ],
    expectedChain: [
      'workspace.getStatus',
      'workspace.listFiles',
      'workspace.downloadFile',
      'approval',
    ],
  },
  {
    id: 'save-to-folder',
    title: 'Save to folder',
    description:
      'Save to the connected folder, or mark a browser-only checkpoint when no folder is linked.',
    prompt: 'Save to folder',
    tools: [
      'workspace.getStatus',
      'workspace.saveAll',
      'workspace.saveCheckpoint',
    ],
    expectedChain: [
      'workspace.getStatus',
      'workspace.saveAll (folder) / workspace.saveCheckpoint (browser-only)',
      'approval only for filesystem write',
    ],
  },
  {
    id: 'reload-folder',
    title: 'Reload folder',
    description:
      'Re-read the connected folder only after an approval decision.',
    prompt: 'Reload folder',
    tools: ['workspace.getStatus', 'workspace.reloadFolder'],
    expectedChain: [
      'workspace.getStatus',
      'workspace.reloadFolder',
      'approval → filesystem read',
      'iframe acknowledgement',
    ],
  },
  {
    id: 'disconnect-folder',
    title: 'Disconnect folder',
    description:
      'Stop folder synchronization while retaining the browser workspace.',
    prompt: 'Disconnect folder',
    tools: ['workspace.getStatus', 'workspace.disconnectFolder'],
    expectedChain: [
      'workspace.getStatus',
      'workspace.disconnectFolder',
      'approval',
    ],
  },
  {
    id: 'reset-demo-workspace',
    title: 'Reset demo workspace',
    description:
      'Restore the browser-only seed workspace through destructive approval.',
    prompt: 'Reset demo workspace',
    tools: ['workspace.getStatus', 'workspace.reset'],
    expectedChain: [
      'workspace.getStatus',
      'workspace.reset',
      'approval',
      'iframe acknowledgement',
    ],
  },
] satisfies readonly ToolChainRecipe[];
