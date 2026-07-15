import { createToolContext, type ToolRegistry } from '@context-action/react';
import { requestToolApproval } from './tool-approval';
import { type BoltStyleToolSchema, boltStyleToolSchema } from './tool-schema';
import { recordToolCall } from './tool-trace';

export const {
  Provider: BoltStyleToolProvider,
  useToolHandler: useBoltStyleToolHandler,
  useToolRegistry: useBoltStyleToolRegistry,
} = createToolContext('BoltStyleWebEditor', {
  schema: boltStyleToolSchema,
  debug: true,
  onToolCall: recordToolCall,
  toolPolicy: ({ context, definition, request, signal }) => {
    const isPromptAgentCall = context?.metadata?.interaction === 'prompt';
    if (
      definition.annotations?.readOnlyHint === true ||
      (context?.source === 'local' && !isPromptAgentCall)
    ) {
      return 'allow';
    }
    return requestToolApproval({ request, definition, context, signal });
  },
});

export type BoltStyleRegistry = ToolRegistry<BoltStyleToolSchema>;
