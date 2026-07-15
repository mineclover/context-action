import { createActionSchema, defineAction } from '@context-action/react';
import { z } from 'zod';

const scenarioSchema = z.enum(['success', 'invalid', 'blocked']);
const expectedRevisionSchema = z.number().int().nonnegative().optional();

export const getEditorDocumentTool = defineAction(
  {
    name: 'editor.getDocument',
    description: 'Read the current parent-owned Live Code Editor document.',
    annotations: { readOnlyHint: true },
    parameters: z.object({}),
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
  },
  z
);

export const setEditorScenarioTool = defineAction(
  {
    name: 'editor.setScenario',
    description: 'Select the next safe runner scenario in the editor preview.',
    annotations: { idempotentHint: true },
    parameters: z.object({ scenario: scenarioSchema }),
  },
  z
);

export const resetEditorDocumentTool = defineAction(
  {
    name: 'editor.resetDocument',
    description: 'Reset the current editor source to its selected example.',
    annotations: { destructiveHint: true },
    parameters: z.object({}),
  },
  z
);

export const liveEditorToolsSchema = createActionSchema({
  'editor.getDocument': getEditorDocumentTool,
  'editor.setDocument': setEditorDocumentTool,
  'editor.getPreviewStatus': getEditorPreviewStatusTool,
  'editor.applyPatch': applyEditorPatchTool,
  'editor.setScenario': setEditorScenarioTool,
  'editor.resetDocument': resetEditorDocumentTool,
});

export type LiveEditorToolsActions = typeof liveEditorToolsSchema;
