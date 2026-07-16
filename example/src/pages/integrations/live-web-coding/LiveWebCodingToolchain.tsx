import { createToolContext } from '@context-action/react';
import { liveWebCodingToolsSchema } from '../../../lib/live-web-coding-tools-schema';
import { recordLiveWebCodingToolCall } from '../../../lib/live-web-coding-trace';

export const {
  Provider: LiveWebCodingToolProvider,
  useToolHandler: useLiveWebCodingToolHandler,
  useToolRegistry: useLiveWebCodingToolRegistry,
} = createToolContext('LiveWebCodingTools', {
  schema: liveWebCodingToolsSchema,
  debug: true,
  onToolCall: recordLiveWebCodingToolCall,
});

export type WebToolRegistry = ReturnType<typeof useLiveWebCodingToolRegistry>;
