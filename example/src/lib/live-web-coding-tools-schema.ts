import { createActionSchema, defineAction } from '@context-action/react';
import { z } from 'zod';

const workspacePath = z.string().min(1).max(240);

export const getWebWorkspaceTool = defineAction(
  {
    name: 'web.getWorkspace',
    description:
      'Read the files and active entry point of the parent-owned realtime web workspace.',
    annotations: { readOnlyHint: true },
    parameters: z.object({}),
  },
  z
);

export const readWebFileTool = defineAction(
  {
    name: 'web.readFile',
    description: 'Read one text file from the realtime web workspace.',
    annotations: { readOnlyHint: true },
    parameters: z.object({ path: workspacePath }),
  },
  z
);

export const writeWebFileTool = defineAction(
  {
    name: 'web.writeFile',
    description:
      'Replace one text file in the realtime web workspace and wait for the sandbox preview to acknowledge the new revision.',
    annotations: { idempotentHint: true },
    parameters: z.object({
      path: workspacePath,
      source: z.string().max(100_000),
    }),
  },
  z
);

export const setWebThemeTool = defineAction(
  {
    name: 'web.setTheme',
    description:
      'Change the visual theme of the demo by updating the CSS file through the same workspace tool boundary.',
    annotations: { idempotentHint: true },
    parameters: z.object({
      theme: z.enum(['violet', 'emerald', 'amber', 'rose', 'sky']),
    }),
  },
  z
);

export const addWebFeatureTool = defineAction(
  {
    name: 'web.addFeature',
    description:
      'Add a feature card to the landing page by updating the HTML workspace file.',
    parameters: z.object({
      title: z.string().min(1).max(80),
      description: z.string().min(1).max(180),
    }),
  },
  z
);

export const updateWebHeroTool = defineAction(
  {
    name: 'web.updateHero',
    description: 'Update the landing page hero title and supporting copy.',
    annotations: { idempotentHint: true },
    parameters: z.object({
      title: z.string().min(1).max(100),
      subtitle: z.string().min(1).max(220),
    }),
  },
  z
);

export const runWebPreviewTool = defineAction(
  {
    name: 'web.runPreview',
    description:
      'Read the current rendered preview status after workspace edits.',
    annotations: { readOnlyHint: true },
    parameters: z.object({}),
  },
  z
);

export const liveWebCodingToolsSchema = createActionSchema({
  'web.getWorkspace': getWebWorkspaceTool,
  'web.readFile': readWebFileTool,
  'web.writeFile': writeWebFileTool,
  'web.setTheme': setWebThemeTool,
  'web.addFeature': addWebFeatureTool,
  'web.updateHero': updateWebHeroTool,
  'web.runPreview': runWebPreviewTool,
});

export type LiveWebCodingToolsActions = typeof liveWebCodingToolsSchema;
