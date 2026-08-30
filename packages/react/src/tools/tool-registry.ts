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
  DurableOperationFence,
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
  context: ToolCallContext | undefined,
  expectedFence: DurableOperationFence
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

  // Snapshot both membership inputs. A registry is one catalog, not a live
  // view over caller-owned configuration that can diverge from its executor.
  const catalog = Object.freeze({ ...schema }) as TSchema;
  const allowedNames = allowedToolNames ? new Set(allowedToolNames) : undefined;
  const toolNames = Object.freeze(Object.keys(catalog).filter(
    name => !allowedNames || allowedNames.has(name)
  ) as (keyof TSchema)[]);
  const hasOwnTool = (name: string): boolean =>
    Object.getOwnPropertyDescriptor(catalog, name) !== undefined &&
    (!allowedNames || allowedNames.has(name));
  const getExportableTool = <K extends keyof TSchema>(name: K): TSchema[K] => {
    if (!hasOwnTool(String(name))) {
      throw new Error(`Tool "${String(name)}" is not available in registry`);
    }

    const tool = catalog[name];
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
      return { tools: toolNames.map(name => catalog[name]!.toMCP()) };
    }

    const start = request.params?.cursor
      ? parseToolListCursor(request.params.cursor, toolNames.length)
      : 0;
    const end = Math.min(start + toolListPageSize, toolNames.length);
    return {
      tools: toolNames.slice(start, end).map(name => catalog[name]!.toMCP()),
      ...(end < toolNames.length ? { nextCursor: encodeToolListCursor(end) } : {}),
    };
  };
  // The executor is deliberately transport-neutral, so it returns the broad
  // protocol result. The registry's source-track overloads add schema-aware
  // inference for literal callers while retaining that dynamic execution ABI.
  const callTool = ((
    request: ToolCallRequest,
    options?: ToolCallOptions
  ): Promise<ToolCallResult> => executeToolCall(request, options)) as ToolRegistry<
    TSchema
  >['callTool'];
  const executeModelToolCall = ((
    call: ModelToolCall,
    options?: ToolCallOptions
  ): Promise<ToolCallResult> => executeToolCall(toToolCallRequest(call), {
    ...options,
    context: {
      ...options?.context,
      source: options?.context?.source ?? 'model',
      mode: options?.context?.mode ?? 'agent',
    },
  })) as ToolRegistry<TSchema>['executeModelToolCall'];

  return {
    tools: catalog,
    getTool<K extends keyof TSchema>(name: K): TSchema[K] {
      if (Object.getOwnPropertyDescriptor(catalog, String(name)) === undefined) {
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
      return catalog[name]?.toMCP();
    },
    callTool,
    executeModelToolCall,
    async getOperationStatus(toolName, idempotencyKey, context) {
      if (!hasOwnTool(toolName)) return undefined;
      return getOperationStatus?.(toolName, idempotencyKey, context);
    },
    async reconcileOperation(toolName, idempotencyKey, resolution, context, expectedFence) {
      if (!hasOwnTool(toolName)) return undefined;
      if (!reconcileOperation) return undefined;
      if (typeof expectedFence !== 'object' || expectedFence === null) {
        throw new Error(
          'Tool operation reconciliation requires a full { incarnation, revision } ' +
          'fifth-argument fence or recoverOperation(); omitted and numeric legacy ' +
          'fences fail closed.'
        );
      }
      return reconcileOperation(
        toolName,
        idempotencyKey,
        resolution,
        context,
        expectedFence
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
        { incarnation: record.incarnation, revision: record.revision }
      );
    },
    getToolNames(): (keyof TSchema)[] {
      return [...toolNames];
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
