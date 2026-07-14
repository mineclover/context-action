import { createActionSchema, defineAction } from '@context-action/react';
import { z } from 'zod';

const filePath = z.string().min(1).max(160);

export const boltStyleToolSchema = createActionSchema({
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
  'workspace.writeFile': defineAction(
    {
      name: 'workspace.writeFile',
      description: 'Replace one text file and refresh the live preview.',
      annotations: { idempotentHint: true },
      parameters: z.object({ path: filePath, source: z.string().max(80_000) }),
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
