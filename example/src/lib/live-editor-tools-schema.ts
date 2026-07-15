import { createActionSchema, defineAction } from '@context-action/react';
import { z } from 'zod';

const scenarioSchema = z.enum(['success', 'invalid', 'blocked']);
const expectedRevisionSchema = z.number().int().nonnegative().optional();
const editorPreviewOutputSchema = z.object({
  state: z.enum(['pending', 'rendered', 'timeout', 'error']),
  revision: z.number().int(),
  message: z.string().optional(),
});
const editorWorkspaceFileSchema = z.object({
  isText: z.boolean(),
  mimeType: z.string(),
  path: z.string(),
  size: z.number().int().nonnegative(),
});
const editorListFilesOutputSchema = z.object({
  activePath: z.string(),
  workspaceRevision: z.number().int().nonnegative(),
  dirtyPaths: z.array(z.string()),
  rootName: z.string(),
  storageMode: z.enum(['memory', 'indexed-db']),
  files: z.array(editorWorkspaceFileSchema),
});
const editorDocumentOutputSchema = z.object({
  exampleId: z.string(),
  file: z.string(),
  source: z.string(),
  scenario: z.string(),
  revision: z.number().int().nonnegative(),
  activePath: z.string(),
  workspaceRevision: z.number().int().nonnegative(),
  documentRevision: z.number().int().nonnegative(),
});
const editorDocumentMutationOutputSchema = editorDocumentOutputSchema.extend({
  preview: editorPreviewOutputSchema,
});
const editorSaveFileOutputSchema = z.object({
  path: z.string(),
  activePath: z.string(),
  savedTo: z.literal('filesystem'),
  dirtyPaths: z.array(z.string()),
  workspaceRevision: z.number().int().nonnegative(),
  documentRevision: z.number().int().nonnegative(),
});
const editorSaveAllOutputSchema = z.object({
  savedPaths: z.array(z.string()),
  activePath: z.string(),
  dirtyPaths: z.array(z.string()),
  workspaceRevision: z.number().int().nonnegative(),
  documentRevision: z.number().int().nonnegative(),
});
const editorStatusOutputSchema = z.object({
  activePath: z.string(),
  documentPath: z.string(),
  documentExampleId: z.string(),
  rootName: z.string(),
  workspaceRevision: z.number().int().nonnegative(),
  documentRevision: z.number().int().nonnegative(),
  storageMode: z.enum(['memory', 'indexed-db']),
  fileCount: z.number().int().nonnegative(),
  dirtyPaths: z.array(z.string()),
  filesystem: z.object({
    mode: z.enum(['local-folder', 'browser-only']),
    folderLinked: z.boolean(),
    saveAllAvailable: z.boolean(),
  }),
  preview: z.object({
    state: z.enum(['pending', 'rendered', 'timeout', 'error']),
    revision: z.number().int(),
    message: z.string().optional(),
  }),
});

export const getEditorStatusTool = defineAction(
  {
    name: 'editor.getStatus',
    description:
      'Read editor and workspace revision, persistence, preview, dirty-file, and local-folder connection status.',
    annotations: { readOnlyHint: true },
    parameters: z.object({}),
    outputSchema: editorStatusOutputSchema,
  },
  z
);

export const listEditorFilesTool = defineAction(
  {
    name: 'editor.listFiles',
    description:
      'List the files in the current browser workspace, including the active path, storage mode, and filesystem-dirty paths.',
    annotations: { readOnlyHint: true },
    parameters: z.object({}),
    outputSchema: editorListFilesOutputSchema,
  },
  z
);

export const openEditorFileTool = defineAction(
  {
    name: 'editor.openFile',
    description:
      'Select a text file in the current browser workspace and wait for its preview revision. Use editor.listFiles before choosing a path.',
    parameters: z.object({
      path: z.string().min(1).max(2_000),
    }),
    outputSchema: editorDocumentMutationOutputSchema,
  },
  z
);

export const saveEditorFileTool = defineAction(
  {
    name: 'editor.saveFile',
    description:
      'Write one text file from the parent-owned browser workspace back to the opened local folder. Requires a writable folder workspace.',
    annotations: { destructiveHint: true, idempotentHint: true },
    parameters: z.object({
      path: z.string().min(1).max(2_000),
    }),
    outputSchema: editorSaveFileOutputSchema,
  },
  z
);

export const saveAllEditorFilesTool = defineAction(
  {
    name: 'editor.saveAll',
    description:
      'Write every dirty text file from the parent-owned browser workspace back to the opened local folder. Requires a writable folder workspace.',
    annotations: { destructiveHint: true, idempotentHint: true },
    parameters: z.object({}),
    outputSchema: editorSaveAllOutputSchema,
  },
  z
);

export const getEditorDocumentTool = defineAction(
  {
    name: 'editor.getDocument',
    description: 'Read the current parent-owned Live Code Editor document.',
    annotations: { readOnlyHint: true },
    parameters: z.object({}),
    outputSchema: editorDocumentOutputSchema,
  },
  z
);

export const setEditorDocumentTool = defineAction(
  {
    name: 'editor.setDocument',
    description:
      'Replace the controlled editor source and optionally select a preview scenario. The source is displayed as text and is never executed in the iframe.',
    annotations: { idempotentHint: true },
    parameters: z.object({
      source: z.string().min(1).max(100_000),
      scenario: scenarioSchema.optional(),
    }),
    outputSchema: editorDocumentMutationOutputSchema,
  },
  z
);

export const getEditorPreviewStatusTool = defineAction(
  {
    name: 'editor.getPreviewStatus',
    description:
      'Read whether the current document revision is rendered in the iframe.',
    annotations: { readOnlyHint: true },
    parameters: z.object({}),
    outputSchema: editorPreviewOutputSchema,
  },
  z
);

export const applyEditorPatchTool = defineAction(
  {
    name: 'editor.applyPatch',
    description:
      'Replace a bounded literal text match in the current document and wait for the matching iframe revision. An optional expectedRevision rejects stale edits.',
    parameters: z.object({
      search: z.string().min(1).max(20_000),
      replace: z.string().max(20_000),
      occurrence: z.enum(['first', 'all']),
      expectedRevision: expectedRevisionSchema,
    }),
    outputSchema: editorDocumentMutationOutputSchema.extend({
      replacements: z.number().int().positive(),
    }),
  },
  z
);

export const setEditorScenarioTool = defineAction(
  {
    name: 'editor.setScenario',
    description: 'Select the next safe runner scenario in the editor preview.',
    annotations: { idempotentHint: true },
    parameters: z.object({ scenario: scenarioSchema }),
    outputSchema: editorDocumentMutationOutputSchema,
  },
  z
);

export const resetEditorDocumentTool = defineAction(
  {
    name: 'editor.resetDocument',
    description: 'Reset the current editor source to its selected example.',
    annotations: { destructiveHint: true },
    parameters: z.object({}),
    outputSchema: editorDocumentMutationOutputSchema,
  },
  z
);

export const liveEditorToolsSchema = createActionSchema({
  'editor.getStatus': getEditorStatusTool,
  'editor.listFiles': listEditorFilesTool,
  'editor.openFile': openEditorFileTool,
  'editor.saveFile': saveEditorFileTool,
  'editor.saveAll': saveAllEditorFilesTool,
  'editor.getDocument': getEditorDocumentTool,
  'editor.setDocument': setEditorDocumentTool,
  'editor.getPreviewStatus': getEditorPreviewStatusTool,
  'editor.applyPatch': applyEditorPatchTool,
  'editor.setScenario': setEditorScenarioTool,
  'editor.resetDocument': resetEditorDocumentTool,
});

export type LiveEditorToolsActions = typeof liveEditorToolsSchema;
