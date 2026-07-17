import { createActionSchema, defineAction } from '@context-action/react';
import { z } from 'zod';
import { livePreviewStatusSchema } from './live-tool-result-contract';

const workspacePath = z.string().min(1).max(240);
const expectedRevision = z.number().int().nonnegative().optional();
const webWorkspaceFileSchema = z.object({
  path: z.string(),
  isText: z.boolean(),
  size: z.number().int().nonnegative(),
});
const webWorkspaceOutputSchema = z.object({
  activePath: z.string(),
  rootName: z.string(),
  revision: z.number().int().nonnegative(),
  files: z.array(webWorkspaceFileSchema),
});
const webReadFileOutputSchema = z.object({
  path: z.string(),
  source: z.string(),
  revision: z.number().int().nonnegative(),
});
const webMutationOutputSchema = z.object({
  path: z.string(),
  activePath: z.string(),
  revision: z.number().int().nonnegative(),
  preview: livePreviewStatusSchema,
});
const webPatchOutputSchema = webMutationOutputSchema.extend({
  replacements: z.number().int().positive(),
});
const webThemeOutputSchema = webMutationOutputSchema.extend({
  theme: z.enum(['violet', 'emerald', 'amber', 'rose', 'sky']),
});
const webFeatureOutputSchema = webMutationOutputSchema.extend({
  title: z.string(),
});
const webPreviewOutputSchema = z.object({
  workspace: webWorkspaceOutputSchema,
  preview: livePreviewStatusSchema,
});

export const getWebWorkspaceTool = defineAction(
  {
    name: 'web.getWorkspace',
    description:
      'Read the files and active entry point of the parent-owned realtime web workspace.',
    annotations: { readOnlyHint: true },
    parameters: z.object({}),
    outputSchema: webWorkspaceOutputSchema,
  },
  z
);

export const readWebFileTool = defineAction(
  {
    name: 'web.readFile',
    description: 'Read one text file from the realtime web workspace.',
    annotations: { readOnlyHint: true },
    parameters: z.object({ path: workspacePath }),
    outputSchema: webReadFileOutputSchema,
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
      expectedRevision,
    }),
    outputSchema: webMutationOutputSchema,
  },
  z
);

export const applyWebPatchTool = defineAction(
  {
    name: 'web.applyPatch',
    description:
      'Apply a bounded literal text replacement to one realtime web workspace file and wait for the sandbox preview revision. An optional expectedRevision rejects stale edits.',
    parameters: z.object({
      path: workspacePath,
      search: z.string().min(1).max(20_000),
      replace: z.string().max(20_000),
      occurrence: z.enum(['first', 'all']),
      expectedRevision,
    }),
    outputSchema: webPatchOutputSchema,
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
      expectedRevision,
    }),
    outputSchema: webThemeOutputSchema,
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
      expectedRevision,
    }),
    outputSchema: webFeatureOutputSchema,
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
      expectedRevision,
    }),
    outputSchema: webFeatureOutputSchema,
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
    outputSchema: webPreviewOutputSchema,
  },
  z
);

export const liveWebCodingToolsSchema = createActionSchema({
  'web.getWorkspace': getWebWorkspaceTool,
  'web.readFile': readWebFileTool,
  'web.writeFile': writeWebFileTool,
  'web.applyPatch': applyWebPatchTool,
  'web.setTheme': setWebThemeTool,
  'web.addFeature': addWebFeatureTool,
  'web.updateHero': updateWebHeroTool,
  'web.runPreview': runWebPreviewTool,
});

export type LiveWebCodingToolsActions = typeof liveWebCodingToolsSchema;
