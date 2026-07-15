import { createActionSchema, defineAction } from '@context-action/react';
import { z } from 'zod';

const filePath = z.string().min(1).max(160);
const expectedRevision = z.number().int().nonnegative().optional();
const workspacePersistenceOutputSchema = z.object({
  storageMode: z.enum(['loading', 'indexed-db', 'memory']),
  storageError: z.string().optional(),
});
const workspaceFileSummarySchema = z.object({
  path: z.string(),
  language: z.string(),
  size: z.number().int().nonnegative(),
  kind: z.enum(['text', 'asset']),
  mimeType: z.string().optional(),
  dirty: z.boolean(),
});
const workspaceListFilesOutputSchema = workspacePersistenceOutputSchema.extend({
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  dirty: z.boolean(),
  deletedPaths: z.array(z.string()),
  files: z.array(workspaceFileSummarySchema),
});
const workspaceReadFileOutputSchema = workspacePersistenceOutputSchema.extend({
  path: z.string(),
  source: z.string(),
  revision: z.number().int().nonnegative(),
});
const workspaceDownloadOutputSchema = workspacePersistenceOutputSchema.extend({
  path: z.string(),
  kind: z.enum(['text', 'asset']),
  size: z.number().int().nonnegative(),
});
const fileSystemPermissionSchema = z.enum([
  'granted',
  'prompt',
  'denied',
  'unknown',
  'disconnected',
]);
const workspaceOpenFileOutputSchema = workspacePersistenceOutputSchema.extend({
  path: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
});
const syncedWorkspaceMutationOutputSchema =
  workspacePersistenceOutputSchema.extend({
    path: z.string(),
    activePath: z.string(),
    revision: z.number().int().nonnegative(),
    preview: z.literal('synced'),
  });
const workspaceCreateFileOutputSchema =
  syncedWorkspaceMutationOutputSchema.extend({
    language: z.string(),
  });
const workspaceRenameFileOutputSchema = workspacePersistenceOutputSchema.extend(
  {
    fromPath: z.string(),
    toPath: z.string(),
    activePath: z.string(),
    revision: z.number().int().nonnegative(),
    preview: z.literal('synced'),
  }
);
const workspaceSaveAllOutputSchema = workspacePersistenceOutputSchema.extend({
  savedPaths: z.array(z.string()),
  deletedPaths: z.array(z.string()),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  checkpointUpdated: z.boolean().optional(),
});
const workspaceSaveCheckpointOutputSchema =
  workspacePersistenceOutputSchema.extend({
    savedPaths: z.array(z.string()),
    deletedPaths: z.array(z.string()),
    activePath: z.string(),
    revision: z.number().int().nonnegative(),
    checkpointUpdated: z.literal(true),
  });
const workspaceReloadFolderOutputSchema =
  workspacePersistenceOutputSchema.extend({
    rootName: z.string(),
    activePath: z.string(),
    fileCount: z.number().int().nonnegative(),
    skipped: z.array(z.string()),
    revision: z.number().int().nonnegative(),
    preview: z.literal('synced'),
    filesystem: z.object({
      mode: z.literal('local-folder'),
      folderLinked: z.literal(true),
      permission: fileSystemPermissionSchema,
      saveAllAvailable: z.literal(true),
      reloadAvailable: z.literal(true),
    }),
  });
const workspaceDisconnectFolderOutputSchema =
  workspacePersistenceOutputSchema.extend({
    activePath: z.string(),
    revision: z.number().int().nonnegative(),
    filesystem: z.object({
      mode: z.literal('browser-only'),
      folderLinked: z.literal(false),
      permission: z.literal('disconnected'),
      saveAllAvailable: z.literal(false),
      reloadAvailable: z.literal(false),
    }),
  });
const workspacePatchOutputSchema = syncedWorkspaceMutationOutputSchema.extend({
  replacements: z.number().int().positive(),
});
const workspaceHistoryOutputSchema = workspacePersistenceOutputSchema.extend({
  direction: z.enum(['undo', 'redo']),
  changed: z.boolean(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
});
const previewThemeOutputSchema = workspacePersistenceOutputSchema.extend({
  theme: z.enum(['violet', 'emerald', 'amber', 'rose']),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
});
const previewFeatureOutputSchema = workspacePersistenceOutputSchema.extend({
  title: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
});
const previewStatusOutputSchema = workspacePersistenceOutputSchema.extend({
  revision: z.number().int().nonnegative(),
  status: z.enum(['waiting', 'synced', 'error']),
  message: z.string().optional(),
  runtime: z.literal('sandbox iframe'),
});
const previewRefreshOutputSchema = workspacePersistenceOutputSchema.extend({
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
});
const workspaceStatusOutputSchema = workspacePersistenceOutputSchema.extend({
  rootName: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: z.object({
    revision: z.number().int(),
    status: z.enum(['waiting', 'synced', 'error']),
    message: z.string().optional(),
  }),
  fileCount: z.number().int().nonnegative(),
  dirtyPaths: z.array(z.string()),
  deletedPaths: z.array(z.string()),
  history: z.object({
    canUndo: z.boolean(),
    canRedo: z.boolean(),
  }),
  filesystem: z.object({
    mode: z.enum(['local-folder', 'browser-only']),
    folderLinked: z.boolean(),
    permission: fileSystemPermissionSchema,
    saveAllAvailable: z.boolean(),
    reloadAvailable: z.boolean(),
  }),
});
const workspaceResetOutputSchema = workspacePersistenceOutputSchema.extend({
  rootName: z.string(),
  activePath: z.string(),
  fileCount: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
  preview: z.literal('synced'),
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
  'workspace.reset': defineAction(
    {
      name: 'workspace.reset',
      description:
        'Restore the browser-only demo workspace to its initial HTML, CSS, JS, and README files, optionally guarded by a workspace revision.',
      annotations: { destructiveHint: true, idempotentHint: true },
      parameters: z.object({ expectedRevision }),
      outputSchema: workspaceResetOutputSchema,
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
  'workspace.downloadFile': defineAction(
    {
      name: 'workspace.downloadFile',
      description:
        'Download one workspace text file or Blob asset through the browser, requiring a path.',
      annotations: { openWorldHint: true },
      parameters: z.object({ path: filePath }),
      outputSchema: workspaceDownloadOutputSchema,
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
      parameters: z.object({ expectedRevision }),
      outputSchema: workspaceSaveAllOutputSchema,
    },
    z
  ),
  'workspace.saveCheckpoint': defineAction(
    {
      name: 'workspace.saveCheckpoint',
      description:
        'Mark the browser-only workspace checkpoint clean without writing to an operating-system folder. Requires no linked writable folder and may be guarded by a workspace revision.',
      annotations: { destructiveHint: true, idempotentHint: true },
      parameters: z.object({ expectedRevision }),
      outputSchema: workspaceSaveCheckpointOutputSchema,
    },
    z
  ),
  'workspace.reloadFolder': defineAction(
    {
      name: 'workspace.reloadFolder',
      description:
        'Re-read the connected local folder into the browser workspace and refresh the preview. Requires a writable folder workspace.',
      annotations: { destructiveHint: true, idempotentHint: true },
      parameters: z.object({ expectedRevision }),
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
  'workspace.undo': defineAction(
    {
      name: 'workspace.undo',
      description:
        'Undo the latest workspace edit and refresh the live preview, optionally guarded by a workspace revision.',
      annotations: { destructiveHint: true },
      parameters: z.object({ expectedRevision }),
      outputSchema: workspaceHistoryOutputSchema,
    },
    z
  ),
  'workspace.redo': defineAction(
    {
      name: 'workspace.redo',
      description:
        'Redo the next workspace edit and refresh the live preview, optionally guarded by a workspace revision.',
      annotations: { destructiveHint: true },
      parameters: z.object({ expectedRevision }),
      outputSchema: workspaceHistoryOutputSchema,
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
  'preview.refresh': defineAction(
    {
      name: 'preview.refresh',
      description:
        'Remount the sandbox iframe for the current workspace revision and wait for its acknowledgement.',
      annotations: { idempotentHint: true },
      parameters: z.object({}),
      outputSchema: previewRefreshOutputSchema,
    },
    z
  ),
});

export type BoltStyleToolSchema = typeof boltStyleToolSchema;
