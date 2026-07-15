import { createActionSchema, defineAction } from '@context-action/react';
import { z } from 'zod';

const filePath = z.string().min(1).max(160);
const expectedRevision = z.number().int().nonnegative().optional();

export const boltStyleToolSchema = createActionSchema({
  'workspace.getStatus': defineAction(
    {
      name: 'workspace.getStatus',
      description:
        'Read workspace revision, persistence, preview, dirty-file, and local-folder connection status.',
      annotations: { readOnlyHint: true },
      parameters: z.object({}),
    },
    z
  ),
  'workspace.listFiles': defineAction(
    {
      name: 'workspace.listFiles',
      description: 'List the files in the browser-local web workspace.',
      annotations: { readOnlyHint: true },
      parameters: z.object({}),
    },
    z
  ),
  'workspace.readFile': defineAction(
    {
      name: 'workspace.readFile',
      description: 'Read one text file from the web workspace.',
      annotations: { readOnlyHint: true },
      parameters: z.object({ path: filePath }),
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
    },
    z
  ),
  'preview.getStatus': defineAction(
    {
      name: 'preview.getStatus',
      description: 'Read the current workspace revision and preview status.',
      annotations: { readOnlyHint: true },
      parameters: z.object({}),
    },
    z
  ),
});

export type BoltStyleToolSchema = typeof boltStyleToolSchema;
