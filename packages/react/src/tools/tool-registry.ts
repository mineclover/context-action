/**
 * Provider-neutral registry facade for a React tool context.
 *
 * This module owns discovery, definition export, and canonical request
 * forwarding. It deliberately does not know about React or ActionRegister;
 * the supplied executor is the only execution boundary.
 */

import type {
  ActionSchemaMap,
  ModelToolCall,
  ToolCallContext,
  ToolCallOptions,
  ToolCallRequest,
  ToolCallResult,
  ToolListRequest,
} from '@context-action/tool-protocol';
import {
  isToolListRequest,
  toAnthropicToolDefinitions,
  toOpenAIToolDefinitions,
  toToolCallRequest,
} from '@context-action/tool-protocol';
import type {
  DurableOperationRecord,
  DurableOperationResolution,
} from '@context-action/tool-durable-operations';
import type {
  ToolOperationRecoveryResolver,
  ToolRegistry,
} from './ToolContext.types';

export type ToolCallExecutor = (
  request: ToolCallRequest,
  options?: ToolCallOptions
) => Promise<ToolCallResult>;

export type ToolOperationStatusReader = (
  toolName: string,
  idempotencyKey: string,
  context?: ToolCallContext
) => Promise<DurableOperationRecord<ToolCallResult> | undefined>;

export type ToolOperationReconciler = (
  toolName: string,
  idempotencyKey: string,
  resolution: DurableOperationResolution<ToolCallResult>,
  context?: ToolCallContext,
  expectedRevision?: number
) => Promise<DurableOperationRecord<ToolCallResult> | undefined>;

const TOOL_LIST_CURSOR_PREFIX = 'offset:';

function encodeToolListCursor(offset: number): string {
  return `${TOOL_LIST_CURSOR_PREFIX}${offset}`;
}

function parseToolListCursor(cursor: string, toolCount: number): number {
  if (!cursor.startsWith(TOOL_LIST_CURSOR_PREFIX)) {
    throw new Error('Invalid tools/list cursor.');
  }
  const offset = Number(cursor.slice(TOOL_LIST_CURSOR_PREFIX.length));
  if (!Number.isInteger(offset) || offset < 0 || offset > toolCount) {
    throw new Error('Invalid tools/list cursor.');
  }
  return offset;
}

export function createToolRegistry<TSchema extends ActionSchemaMap>(
  schema: TSchema,
  executeToolCall: ToolCallExecutor,
  allowedToolNames?: readonly string[],
  toolListPageSize?: number,
  getOperationStatus?: ToolOperationStatusReader,
  reconcileOperation?: ToolOperationReconciler
): ToolRegistry<TSchema> {
  if (
    toolListPageSize !== undefined &&
    (!Number.isInteger(toolListPageSize) || toolListPageSize <= 0)
  ) {
    throw new Error('toolListPageSize must be a positive integer.');
  }

  const allowedNames = allowedToolNames ? new Set(allowedToolNames) : undefined;
  const toolNames = Object.keys(schema).filter(
    name => !allowedNames || allowedNames.has(name)
  ) as (keyof TSchema)[];
  const hasOwnTool = (name: string): boolean =>
    Object.getOwnPropertyDescriptor(schema, name) !== undefined &&
    (!allowedNames || allowedNames.has(name));
  const getExportableTool = <K extends keyof TSchema>(name: K): TSchema[K] => {
    if (!hasOwnTool(String(name))) {
      throw new Error(`Tool "${String(name)}" is not available in registry`);
    }

    const tool = schema[name];
    if (!tool) {
      throw new Error(`Tool "${String(name)}" is not available in registry`);
    }
    return tool;
  };
  const listTools = (request?: ToolListRequest) => {
    if (request !== undefined && !isToolListRequest(request)) {
      throw new Error('Invalid tools/list request.');
    }
    // A direct registry call remains the complete catalog. Canonical
    // tools/list requests can opt into cursor pagination.
    if (!request || toolListPageSize === undefined) {
      return { tools: toolNames.map(name => schema[name]!.toMCP()) };
    }

    const start = request.params?.cursor
      ? parseToolListCursor(request.params.cursor, toolNames.length)
      : 0;
    const end = Math.min(start + toolListPageSize, toolNames.length);
    return {
      tools: toolNames.slice(start, end).map(name => schema[name]!.toMCP()),
      ...(end < toolNames.length ? { nextCursor: encodeToolListCursor(end) } : {}),
    };
  };

  return {
    tools: schema,
    getTool<K extends keyof TSchema>(name: K): TSchema[K] {
      if (Object.getOwnPropertyDescriptor(schema, String(name)) === undefined) {
        throw new Error(`Tool "${String(name)}" not found in registry`);
      }
      return getExportableTool(name);
    },
    hasTool(name: string): boolean {
      return hasOwnTool(name);
    },
    listTools,
    getToolDefinition(name: string) {
      if (!hasOwnTool(name)) return undefined;
      return schema[name]?.toMCP();
    },
    callTool(request, options) {
      return executeToolCall(request, options);
    },
    executeModelToolCall(call: ModelToolCall, options) {
      return executeToolCall(toToolCallRequest(call), {
        ...options,
        context: {
          ...options?.context,
          source: options?.context?.source ?? 'model',
          mode: options?.context?.mode ?? 'agent',
        },
      });
    },
    async getOperationStatus(toolName, idempotencyKey, context) {
      if (!hasOwnTool(toolName)) return undefined;
      return getOperationStatus?.(toolName, idempotencyKey, context);
    },
    async reconcileOperation(toolName, idempotencyKey, resolution, context, expectedRevision) {
      if (!hasOwnTool(toolName)) return undefined;
      return reconcileOperation?.(
        toolName,
        idempotencyKey,
        resolution,
        context,
        expectedRevision
      );
    },
    async recoverOperation(toolName, idempotencyKey, resolver, context) {
      if (!hasOwnTool(toolName)) return undefined;
      if (typeof resolver !== 'function') {
        throw new TypeError('Tool operation recovery resolver must be a function.');
      }
      const record = await getOperationStatus?.(toolName, idempotencyKey, context);
      if (record?.state !== 'unknown') return record;
      if (!reconcileOperation) return record;
      const resolution = await (resolver as ToolOperationRecoveryResolver)(record, context);
      return reconcileOperation(
        toolName,
        idempotencyKey,
        resolution,
        context,
        record.revision
      );
    },
    getToolNames(): (keyof TSchema)[] {
      return toolNames;
    },
    // Compatibility exporters. New provider integrations should consume
    // listTools()/getToolDefinition() through ToolManagementInterface.
    toMCP() {
      return listTools().tools;
    },
    toOpenAI() {
      return toOpenAIToolDefinitions(listTools().tools);
    },
    toAnthropic() {
      return toAnthropicToolDefinitions(listTools().tools);
    },
    toMCPFiltered<K extends keyof TSchema>(names: K[]) {
      return names.map(name => getExportableTool(name).toMCP());
    },
    toOpenAIFiltered<K extends keyof TSchema>(names: K[]) {
      return toOpenAIToolDefinitions(names.map(name => getExportableTool(name).toMCP()));
    },
    toAnthropicFiltered<K extends keyof TSchema>(names: K[]) {
      return toAnthropicToolDefinitions(names.map(name => getExportableTool(name).toMCP()));
    },
  };
}
