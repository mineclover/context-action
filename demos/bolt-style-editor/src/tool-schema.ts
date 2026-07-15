import { createActionSchema, defineAction } from '@context-action/react';
import { z } from 'zod';

const filePath = z.string().min(1).max(160);
const expectedRevision = z.number().int().nonnegative().optional();
const workspaceFileSummarySchema = z.object({
  path: z.string(),
  language: z.string(),
  size: z.number().int().nonnegative(),
  kind: z.enum(['text', 'asset']),
  mimeType: z.string().optional(),
  dirty: z.boolean(),
});
const workspaceListFilesOutputSchema = z.object({
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  dirty: z.boolean(),
  deletedPaths: z.array(z.string()),
  files: z.array(workspaceFileSummarySchema),
});
const workspaceReadFileOutputSchema = z.object({
  path: z.string(),
  source: z.string(),
  revision: z.number().int().nonnegative(),
});
const workspaceOpenFileOutputSchema = z.object({
  path: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
});
const syncedWorkspaceMutationOutputSchema = z.object({
  path: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
});
const workspaceCreateFileOutputSchema =
  syncedWorkspaceMutationOutputSchema.extend({
    language: z.string(),
  });
const workspaceRenameFileOutputSchema = z.object({
  fromPath: z.string(),
  toPath: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
});
const workspaceSaveAllOutputSchema = z.object({
  savedPaths: z.array(z.string()),
  deletedPaths: z.array(z.string()),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  checkpointUpdated: z.boolean().optional(),
});
const workspaceReloadFolderOutputSchema = z.object({
  rootName: z.string(),
  activePath: z.string(),
  fileCount: z.number().int().nonnegative(),
  skipped: z.array(z.string()),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
  filesystem: z.object({
    mode: z.literal('local-folder'),
    folderLinked: z.literal(true),
    saveAllAvailable: z.literal(true),
    reloadAvailable: z.literal(true),
  }),
});
const workspaceDisconnectFolderOutputSchema = z.object({
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  storageMode: z.enum(['indexed-db', 'memory']),
  filesystem: z.object({
    mode: z.literal('browser-only'),
    folderLinked: z.literal(false),
    saveAllAvailable: z.literal(false),
    reloadAvailable: z.literal(false),
  }),
});
const workspacePatchOutputSchema = syncedWorkspaceMutationOutputSchema.extend({
  replacements: z.number().int().positive(),
});
const previewThemeOutputSchema = z.object({
  theme: z.enum(['violet', 'emerald', 'amber', 'rose']),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
});
const previewFeatureOutputSchema = z.object({
  title: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
});
const previewStatusOutputSchema = z.object({
  revision: z.number().int().nonnegative(),
  status: z.enum(['waiting', 'synced', 'error']),
  message: z.string().optional(),
  runtime: z.literal('sandbox iframe'),
});
const workspaceStatusOutputSchema = z.object({
  rootName: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  storageMode: z.enum(['loading', 'indexed-db', 'memory']),
  preview: z.object({
    revision: z.number().int(),
    status: z.enum(['waiting', 'synced', 'error']),
    message: z.string().optional(),
  }),
  fileCount: z.number().int().nonnegative(),
  dirtyPaths: z.array(z.string()),
  deletedPaths: z.array(z.string()),
  filesystem: z.object({
    mode: z.enum(['local-folder', 'browser-only']),
    folderLinked: z.boolean(),
    saveAllAvailable: z.boolean(),
    reloadAvailable: z.boolean(),
  }),
});

export const boltStyleToolSchema = createActionSchema({
  'workspace.getStatus': defineAction(
    {
      name: 'workspace.getStatus',
      description:
        'Read workspace revision, persistence, preview, dirty-file, and local-folder connection status.',
      annotations: { readOnlyHint: true },
      parameters: z.object({}),
      outputSchema: workspaceStatusOutputSchema,
    },
    z
  ),
  'workspace.listFiles': defineAction(
    {
      name: 'workspace.listFiles',
      description: 'List the files in the browser-local web workspace.',
      annotations: { readOnlyHint: true },
      parameters: z.object({}),
      outputSchema: workspaceListFilesOutputSchema,
    },
    z
  ),
  'workspace.readFile': defineAction(
    {
      name: 'workspace.readFile',
      description: 'Read one text file from the web workspace.',
      annotations: { readOnlyHint: true },
      parameters: z.object({ path: filePath }),
      outputSchema: workspaceReadFileOutputSchema,
    },
    z
  ),
  'workspace.openFile': defineAction(
    {
      name: 'workspace.openFile',
      description:
        'Open one workspace file in the editor and persist it as the active path without changing its source.',
      annotations: { readOnlyHint: true },
      parameters: z.object({ path: filePath }),
      outputSchema: workspaceOpenFileOutputSchema,
    },
    z
  ),
  'workspace.createFile': defineAction(
    {
      name: 'workspace.createFile',
      description:
        'Create a new text file in the browser-local web workspace, optionally guarded by a workspace revision.',
      parameters: z.object({
        path: filePath,
        source: z.string().max(80_000),
        expectedRevision,
      }),
      outputSchema: workspaceCreateFileOutputSchema,
    },
    z
  ),
  'workspace.renameFile': defineAction(
    {
      name: 'workspace.renameFile',
      description:
        'Rename one workspace file, preserving its content and refreshing the live preview, optionally guarded by a workspace revision.',
      annotations: { idempotentHint: true },
      parameters: z.object({
        fromPath: filePath,
        toPath: filePath,
        expectedRevision,
      }),
      outputSchema: workspaceRenameFileOutputSchema,
    },
    z
  ),
  'workspace.deleteFile': defineAction(
    {
      name: 'workspace.deleteFile',
      description:
        'Delete one file from the browser-local web workspace, optionally guarded by a workspace revision.',
      annotations: { destructiveHint: true },
      parameters: z.object({ path: filePath, expectedRevision }),
      outputSchema: syncedWorkspaceMutationOutputSchema,
    },
    z
  ),
  'workspace.writeFile': defineAction(
    {
      name: 'workspace.writeFile',
      description:
        'Replace one text file and refresh the live preview, optionally guarded by a workspace revision.',
      annotations: { idempotentHint: true },
      parameters: z.object({
        path: filePath,
        source: z.string().max(80_000),
        expectedRevision,
      }),
      outputSchema: syncedWorkspaceMutationOutputSchema,
    },
    z
  ),
  'workspace.saveAll': defineAction(
    {
      name: 'workspace.saveAll',
      description:
        'Write every dirty workspace file and pending deletion to the user-opened local folder. Requires a writable folder workspace.',
      annotations: { destructiveHint: true, idempotentHint: true },
      parameters: z.object({}),
      outputSchema: workspaceSaveAllOutputSchema,
    },
    z
  ),
  'workspace.reloadFolder': defineAction(
    {
      name: 'workspace.reloadFolder',
      description:
        'Re-read the connected local folder into the browser workspace and refresh the preview. Requires a writable folder workspace.',
      annotations: { destructiveHint: true, idempotentHint: true },
      parameters: z.object({}),
      outputSchema: workspaceReloadFolderOutputSchema,
    },
    z
  ),
  'workspace.disconnectFolder': defineAction(
    {
      name: 'workspace.disconnectFolder',
      description:
        'Disconnect the linked local folder while keeping the browser workspace and its files intact.',
      annotations: { idempotentHint: true },
      parameters: z.object({}),
      outputSchema: workspaceDisconnectFolderOutputSchema,
    },
    z
  ),
  'workspace.applyPatch': defineAction(
    {
      name: 'workspace.applyPatch',
      description:
        'Replace a bounded text match in one workspace file and refresh the live preview; optionally reject stale workspace revisions.',
      parameters: z.object({
        path: filePath,
        search: z.string().min(1).max(20_000),
        replace: z.string().max(20_000),
        occurrence: z.enum(['first', 'all']),
        expectedRevision,
      }),
      outputSchema: workspacePatchOutputSchema,
    },
    z
  ),
  'workspace.revertFile': defineAction(
    {
      name: 'workspace.revertFile',
      description:
        'Restore one file to its last saved browser workspace state, optionally guarded by a workspace revision.',
      annotations: { destructiveHint: true, idempotentHint: true },
      parameters: z.object({ path: filePath, expectedRevision }),
      outputSchema: syncedWorkspaceMutationOutputSchema,
    },
    z
  ),
  'preview.setTheme': defineAction(
    {
      name: 'preview.setTheme',
      description: 'Change the generated page accent theme.',
      annotations: { idempotentHint: true },
      parameters: z.object({
        theme: z.enum(['violet', 'emerald', 'amber', 'rose']),
      }),
      outputSchema: previewThemeOutputSchema,
    },
    z
  ),
  'preview.addFeature': defineAction(
    {
      name: 'preview.addFeature',
      description: 'Add a feature card to the generated landing page.',
      parameters: z.object({
        title: z.string().min(1).max(70),
        description: z.string().min(1).max(160),
      }),
      outputSchema: previewFeatureOutputSchema,
    },
    z
  ),
  'preview.updateHero': defineAction(
    {
      name: 'preview.updateHero',
      description: 'Update the landing page hero copy.',
      annotations: { idempotentHint: true },
      parameters: z.object({
        title: z.string().min(1).max(90),
        subtitle: z.string().min(1).max(180),
      }),
      outputSchema: previewFeatureOutputSchema,
    },
    z
  ),
  'preview.getStatus': defineAction(
    {
      name: 'preview.getStatus',
      description: 'Read the current workspace revision and preview status.',
      annotations: { readOnlyHint: true },
      parameters: z.object({}),
      outputSchema: previewStatusOutputSchema,
    },
    z
  ),
});

export type BoltStyleToolSchema = typeof boltStyleToolSchema;
