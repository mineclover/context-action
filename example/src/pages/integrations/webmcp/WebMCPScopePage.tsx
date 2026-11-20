import { useWebMCPToolScope } from '@context-action/react/webmcp';
import {
  createToolCallError,
  createToolCallSuccess,
  createToolIdempotencyRegistry,
  TOOL_CALL_ERROR_CODES,
  type ToolCallResult,
  type ToolDefinition,
  type ToolManagementInterface,
} from '@context-action/tool-protocol';
import {
  currentWebMCPProfile,
  type WebMCPDocument,
  type WebMCPErrorMode,
  type WebMCPRegistrationOptions,
  type WebMCPToolDefinition,
} from '@context-action/webmcp';
import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CodeBlock,
  Input,
  Label,
} from '@/components/ui';

interface RegisteredBrowserTool {
  readonly definition: WebMCPToolDefinition;
  readonly exposedTo: readonly string[];
  readonly registeredAt: string;
}

interface HostBrowserRegistry {
  readonly document: WebMCPDocument;
  getSnapshot(): readonly RegisteredBrowserTool[];
  subscribe(listener: () => void): () => void;
}

function createHostBrowserRegistry(): HostBrowserRegistry {
  let registered: RegisteredBrowserTool[] = [];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const document: WebMCPDocument = {
    modelContext: {
      async registerTool(
        tool: WebMCPToolDefinition,
        options?: WebMCPRegistrationOptions
      ) {
        const entry: RegisteredBrowserTool = {
          definition: tool,
          exposedTo: options?.exposedTo ?? [],
          registeredAt: new Date().toLocaleTimeString(),
        };
        registered = [
          ...registered.filter((item) => item.definition.name !== tool.name),
          entry,
        ];
        notify();

        if (options?.signal) {
          const onAbort = () => {
            registered = registered.filter(
              (item) => item.definition.name !== tool.name
            );
            notify();
          };
          if (options.signal.aborted) {
            onAbort();
          } else {
            options.signal.addEventListener('abort', onAbort, { once: true });
          }
        }
      },
    },
  };

  return {
    document,
    getSnapshot: () => registered,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: 'lookup_order',
    title: 'Lookup Order',
    description: 'Read order status and total without mutating state.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
      },
      required: ['orderId'],
      additionalProperties: false,
    },
  },
  {
    name: 'issue_refund',
    title: 'Issue Refund',
    description: 'Refund a settled order with idempotency protection.',
    annotations: { readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        amount: { type: 'number' },
      },
      required: ['orderId', 'amount'],
      additionalProperties: false,
    },
  },
];

interface OrderRecord {
  readonly orderId: string;
  readonly customer: string;
  readonly totalUsd: number;
  readonly refundedUsd: number;
  readonly status: 'settled' | 'refunded';
}

function createOrderToolManager(
  onOrdersUpdated: (orders: Record<string, OrderRecord>) => void
): {
  manager: ToolManagementInterface;
  getOrdersSnapshot: () => Record<string, OrderRecord>;
} {
  let orders: Record<string, OrderRecord> = {
    'ORD-101': {
      orderId: 'ORD-101',
      customer: 'Ada Lovelace',
      totalUsd: 120,
      refundedUsd: 0,
      status: 'settled',
    },
  };

  const idempotency = createToolIdempotencyRegistry<ToolCallResult>();

  const executeInternal = async (
    name: string,
    args: Record<string, unknown>,
    idempotencyKey?: string
  ): Promise<ToolCallResult> => {
    if (name === 'lookup_order') {
      const orderId = String(args.orderId ?? '');
      const found = orders[orderId];
      if (!found) {
        return createToolCallError(`Order "${orderId}" was not found.`, {
          code: TOOL_CALL_ERROR_CODES.NOT_FOUND,
          retryable: false,
        });
      }
      return createToolCallSuccess(found);
    }

    if (name === 'issue_refund') {
      const orderId = String(args.orderId ?? '');
      const amount = Number(args.amount ?? 0);
      const runRefund = async (): Promise<ToolCallResult> => {
        const found = orders[orderId];
        if (!found) {
          return createToolCallError(`Order "${orderId}" does not exist.`, {
            code: TOOL_CALL_ERROR_CODES.NOT_FOUND,
            retryable: false,
          });
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          return createToolCallError('Refund amount must be positive.', {
            code: TOOL_CALL_ERROR_CODES.VALIDATION_FAILED,
            retryable: false,
          });
        }
        const nextRefunded = Math.min(
          found.totalUsd,
          found.refundedUsd + amount
        );
        const updated: OrderRecord = {
          ...found,
          refundedUsd: nextRefunded,
          status: nextRefunded >= found.totalUsd ? 'refunded' : 'settled',
        };
        orders = { ...orders, [orderId]: updated };
        onOrdersUpdated(orders);
        return createToolCallSuccess({
          orderId,
          refundedAmount: amount,
          totalRefundedUsd: updated.refundedUsd,
          status: updated.status,
        });
      };

      if (idempotencyKey) {
        const fingerprint = JSON.stringify({ name, orderId, amount });
        const claim = idempotency.claim(idempotencyKey, fingerprint, runRefund);
        if (claim.status === 'conflict') {
          return createToolCallError(
            `Idempotency conflict for key "${idempotencyKey}".`,
            {
              code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_CONFLICT,
              retryable: false,
            }
          );
        }
        if (claim.promise) return claim.promise;
      }

      return runRefund();
    }

    return createToolCallError(`Unknown tool "${name}".`, {
      code: TOOL_CALL_ERROR_CODES.NOT_FOUND,
    });
  };

  const manager: ToolManagementInterface = {
    listTools: () => ({ tools: [...TOOL_DEFINITIONS] }),
    getToolDefinition: (name) =>
      TOOL_DEFINITIONS.find((definition) => definition.name === name),
    hasTool: (name) =>
      TOOL_DEFINITIONS.some((definition) => definition.name === name),
    async callTool(request, options) {
      return executeInternal(
        request.params.name,
        request.params.arguments ?? {},
        options?.idempotencyKey
      );
    },
    async executeModelToolCall(call, options) {
      return executeInternal(
        call.name,
        call.arguments ?? {},
        options?.idempotencyKey
      );
    },
  };

  return { manager, getOrdersSnapshot: () => orders };
}

interface ScopedWebMCPBridgeProps {
  readonly manager: ToolManagementInterface;
  readonly hostDocument: WebMCPDocument;
  readonly toolNames: readonly string[];
  readonly errorMode: WebMCPErrorMode;
  readonly retryKey: string;
  readonly onAfterExecute: (entry: string) => void;
}

function ScopedWebMCPBridge({
  manager,
  hostDocument,
  toolNames,
  errorMode,
  retryKey,
  onAfterExecute,
}: ScopedWebMCPBridgeProps) {
  const scopeState = useWebMCPToolScope(manager, {
    sessionId: 'webmcp-demo-session',
    toolNames,
    document: hostDocument,
    exposedTo: ['https://orders.example.com'],
    errorMode,
    getIdempotencyKey: ({ toolName }) =>
      toolName === 'issue_refund' ? retryKey : undefined,
    afterExecute: ({ invocation, result }) => {
      onAfterExecute(
        `afterExecute(${invocation.toolName}) -> ${result.isError ? `ERROR(${result.error?.code})` : 'OK'}`
      );
    },
  });

  return (
    <div
      className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
      data-testid="webmcp-scope-state"
    >
      <div>
        Bridge Mounted · Host Supported:{' '}
        <strong data-testid="webmcp-supported">
          {String(scopeState.supported)}
        </strong>
      </div>
      <div>
        Active Scoped Tools ({scopeState.activeTools.length}):{' '}
        <strong data-testid="webmcp-active-tools">
          {scopeState.activeTools.join(', ') || 'none'}
        </strong>
      </div>
    </div>
  );
}

export default function WebMCPScopePage() {
  const [hostRegistry] = useState<HostBrowserRegistry>(() =>
    createHostBrowserRegistry()
  );
  const [orders, setOrders] = useState<Record<string, OrderRecord>>({});
  const [{ manager, getOrdersSnapshot }] = useState(() =>
    createOrderToolManager((nextOrders) => setOrders(nextOrders))
  );
  const [scopeMounted, setScopeMounted] = useState(true);
  const [enableLookup, setEnableLookup] = useState(true);
  const [enableRefund, setEnableRefund] = useState(true);
  const [errorMode, setErrorMode] = useState<WebMCPErrorMode>('structured');
  const [orderIdInput, setOrderIdInput] = useState('ORD-101');
  const [retryKey, setRetryKey] = useState('refund-ord-101-step-1');
  const [agentOutput, setAgentOutput] = useState<string>(
    'Invoke a registered browser tool below to inspect the WebMCP execution boundary.'
  );
  const [auditLog, setAuditLog] = useState<string[]>([]);

  const registeredTools = useSyncExternalStore(
    (cb) => hostRegistry.subscribe(cb),
    () => hostRegistry.getSnapshot(),
    () => hostRegistry.getSnapshot()
  );

  const toolNames = useMemo(() => {
    const names: string[] = [];
    if (enableLookup) names.push('lookup_order');
    if (enableRefund) names.push('issue_refund');
    return names;
  }, [enableLookup, enableRefund]);

  const currentOrders =
    Object.keys(orders).length > 0 ? orders : getOrdersSnapshot();
  const nativeBrowserSupported =
    typeof document !== 'undefined' &&
    currentWebMCPProfile.isSupported(document);

  const appendAudit = (entry: string) => {
    setAuditLog((prev) => [entry, ...prev].slice(0, 8));
  };

  const invokeRegisteredTool = async (
    name: string,
    input: Record<string, unknown>
  ) => {
    const entry = registeredTools.find(
      (candidate) => candidate.definition.name === name
    );
    if (!entry) {
      setAgentOutput(
        `Tool "${name}" is not currently registered in document.modelContext.`
      );
      return;
    }

    try {
      const response = await entry.definition.execute(input);
      setAgentOutput(JSON.stringify(response, null, 2));
    } catch (error) {
      setAgentOutput(
        `THROWN ERROR: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">@context-action/webmcp</Badge>
          <Badge variant="outline">@context-action/react/webmcp</Badge>
          <Badge variant="success">@context-action/tool-protocol</Badge>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">
          WebMCP Browser Capability Scope &amp; Lifecycle Registration
        </h1>
        <p className="text-slate-600">
          Demonstrates exposing an explicit capability subset from a canonical{' '}
          <code>ToolManagementInterface</code> into a browser{' '}
          <code>WebMCPDocument</code> via <code>useWebMCPToolScope</code>,
          including <code>AbortSignal</code> teardown, <code>errorMode</code>{' '}
          selection, and idempotency keys.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700">
        Native ambient <code>document.modelContext</code> in current runtime:{' '}
        <strong>
          {nativeBrowserSupported
            ? 'available'
            : 'shimmed via interactive WebMCPDocument host'}
        </strong>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Scoped Registration Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={scopeMounted ? 'danger' : 'primary'}
                onClick={() => setScopeMounted((prev) => !prev)}
              >
                {scopeMounted ? 'Unmount WebMCP Scope' : 'Mount WebMCP Scope'}
              </Button>
              <Button
                size="sm"
                variant={enableLookup ? 'primary' : 'outline'}
                onClick={() => setEnableLookup((prev) => !prev)}
              >
                lookup_order: {enableLookup ? 'ON' : 'OFF'}
              </Button>
              <Button
                size="sm"
                variant={enableRefund ? 'primary' : 'outline'}
                onClick={() => setEnableRefund((prev) => !prev)}
              >
                issue_refund: {enableRefund ? 'ON' : 'OFF'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setErrorMode((prev) =>
                    prev === 'structured' ? 'throw' : 'structured'
                  )
                }
              >
                errorMode: {errorMode}
              </Button>
            </div>

            {scopeMounted ? (
              <ScopedWebMCPBridge
                manager={manager}
                hostDocument={hostRegistry.document}
                toolNames={toolNames}
                errorMode={errorMode}
                retryKey={retryKey}
                onAfterExecute={appendAudit}
              />
            ) : (
              <div
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                data-testid="webmcp-scope-unmounted"
              >
                WebMCP Scope unmounted — AbortSignal cleared browser capability
                registrations.
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registered on Host Document (
                <span data-testid="registered-tool-count">
                  {registeredTools.length}
                </span>
                )
              </div>
              {registeredTools.length === 0 ? (
                <div className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                  No WebMCP tools currently registered.
                </div>
              ) : (
                <ul className="space-y-2">
                  {registeredTools.map((entry) => (
                    <li
                      key={entry.definition.name}
                      className="rounded border border-slate-200 p-2 text-xs"
                    >
                      <div className="font-mono font-semibold text-slate-900">
                        {entry.definition.name}
                      </div>
                      <div className="text-slate-600">
                        annotations:{' '}
                        {JSON.stringify(entry.definition.annotations ?? {})} ·
                        exposedTo: {entry.exposedTo.join(', ')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Simulated Page Agent Execution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="webmcp-order-id">Order ID</Label>
                <Input
                  id="webmcp-order-id"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="webmcp-idempotency-key">
                  Idempotency Key (refund)
                </Label>
                <Input
                  id="webmcp-idempotency-key"
                  value={retryKey}
                  onChange={(e) => setRetryKey(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  void invokeRegisteredTool('lookup_order', {
                    orderId: orderIdInput,
                  })
                }
              >
                Call lookup_order
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void invokeRegisteredTool('issue_refund', {
                    orderId: orderIdInput,
                    amount: 25,
                  })
                }
              >
                Call issue_refund ($25)
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  void invokeRegisteredTool('issue_refund', {
                    orderId: 'MISSING-999',
                    amount: 25,
                  })
                }
              >
                Trigger Error (Missing Order)
              </Button>
            </div>

            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs">
              Order ORD-101 Refunded:{' '}
              <strong data-testid="ord-101-refunded">
                ${currentOrders['ORD-101']?.refundedUsd ?? 0}
              </strong>{' '}
              (status: {currentOrders['ORD-101']?.status ?? 'settled'})
            </div>

            <pre
              className="rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 overflow-x-auto"
              data-testid="webmcp-agent-output"
            >
              {agentOutput}
            </pre>

            {auditLog.length > 0 && (
              <div
                className="rounded border border-slate-200 p-2 font-mono text-xs text-slate-700 space-y-1"
                data-testid="webmcp-audit-log"
              >
                {auditLog.map((item, idx) => (
                  <div key={`${item}-${idx}`}>{item}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock size="sm">
            {`const scopeState = useWebMCPToolScope(manager, {
  sessionId: 'webmcp-demo-session',
  toolNames: ['lookup_order', 'issue_refund'],
  exposedTo: ['https://orders.example.com'],
  errorMode: 'structured',
  getIdempotencyKey: ({ toolName }) => toolName === 'issue_refund' ? retryKey : undefined,
});`}
          </CodeBlock>
        </CardContent>
      </Card>
    </div>
  );
}
