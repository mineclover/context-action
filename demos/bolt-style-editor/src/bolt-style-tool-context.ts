import {
  createToolContext,
  type ToolRegistry,
} from '@context-action/react/tools';
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
    if (
      definition.annotations?.readOnlyHint === true ||
      context?.mode === 'direct'
    ) {
      return 'allow';
    }
    return requestToolApproval({ request, definition, context, signal });
  },
});

export type BoltStyleRegistry = ToolRegistry<BoltStyleToolSchema>;
