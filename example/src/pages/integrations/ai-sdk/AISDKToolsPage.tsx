import {
  type AISDKToolErrorMode,
  AISDKToolExecutionError,
  createAISDKToolScope,
} from '@context-action/ai-sdk';
import {
  createToolApprovalQueue,
  createToolCallError,
  createToolCallSuccess,
  createToolExecutionProvenance,
  createToolObservationSink,
  measureToolOutputBytes,
  TOOL_CALL_ERROR_CODES,
  type ToolCallResult,
  type ToolDefinition,
  type ToolManagementInterface,
  type ToolObservationSinkRecord,
  toToolCallRequest,
} from '@context-action/tool-protocol';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CodeBlock,
} from '@/components/ui';

interface AccountState {
  readonly id: string;
  readonly owner: string;
  readonly balanceUsd: number;
  readonly status: 'active' | 'frozen';
}

const AI_TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: 'get_account_summary',
    title: 'Get Account Summary',
    description:
      'Read current account balance and status without side effects.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
      required: ['accountId'],
      additionalProperties: false,
    },
  },
  {
    name: 'freeze_account',
    title: 'Freeze Account',
    description: 'Freeze an account after explicit user approval.',
    annotations: { readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['accountId', 'reason'],
      additionalProperties: false,
    },
  },
];

interface AIWorkbenchRuntime {
  approvalQueue: ReturnType<typeof createToolApprovalQueue>;
  observeRecord: (
    toolName: string,
    toolCallId: string,
    args: Record<string, unknown>,
    result: ToolCallResult,
    elapsedMs: number
  ) => void;
  getAccounts: () => Record<string, AccountState>;
  manager: ToolManagementInterface;
}

function createAIWorkbenchRuntime(
  onAccountsChanged: (accounts: Record<string, AccountState>) => void,
  onObservationRecorded: (record: ToolObservationSinkRecord) => void
): AIWorkbenchRuntime {
  let accounts: Record<string, AccountState> = {
    'ACCT-42': {
      id: 'ACCT-42',
      owner: 'Grace Hopper',
      balanceUsd: 4250,
      status: 'active',
    },
  };

  const approvalQueue = createToolApprovalQueue({
    idPrefix: 'ai-sdk-approval',
    safeArgumentNames: ['accountId', 'reason'],
  });

  const sinkObserver = createToolObservationSink((record) => {
    onObservationRecorded(record);
  });

  const observeRecord = (
    toolName: string,
    toolCallId: string,
    args: Record<string, unknown>,
    result: ToolCallResult,
    elapsedMs: number
  ) => {
    const provenance = createToolExecutionProvenance({
      ownerId: 'ai-sdk-demo-workbench',
      state: result.isError ? 'failed' : 'completed',
      usedOutputBytes: measureToolOutputBytes(result),
      elapsedMs,
    });
    sinkObserver({
      type: result.isError ? 'failed' : 'completed',
      toolCallId,
      name: toolName,
      request: toToolCallRequest({
        id: toolCallId,
        name: toolName,
        arguments: args,
      }),
      context: {
        source: 'model',
        mode: 'agent',
        sessionId: 'ai-sdk-demo-session',
        metadata: {
          tenant: 'demo-bank',
          secretToken: 'should-be-redacted-by-observability-policy',
        },
      },
      timestamp: Date.now(),
      durationMs: elapsedMs,
      result,
      provenance,
    });
  };

  const runTool = async (
    name: string,
    callId: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> => {
    const startedAt = Date.now();
    let result: ToolCallResult;

    if (name === 'get_account_summary') {
      const accountId = String(args.accountId ?? '');
      const account = accounts[accountId];
      result = account
        ? createToolCallSuccess(account, { toolCallId: callId })
        : createToolCallError(`Account "${accountId}" not found.`, {
            code: TOOL_CALL_ERROR_CODES.NOT_FOUND,
            toolCallId: callId,
          });
    } else if (name === 'freeze_account') {
      const accountId = String(args.accountId ?? '');
      const reason = String(args.reason ?? '');
      const account = accounts[accountId];
      if (!account) {
        result = createToolCallError(`Account "${accountId}" not found.`, {
          code: TOOL_CALL_ERROR_CODES.NOT_FOUND,
          toolCallId: callId,
        });
      } else {
        const updated: AccountState = { ...account, status: 'frozen' };
        accounts = { ...accounts, [accountId]: updated };
        onAccountsChanged(accounts);
        result = createToolCallSuccess(
          { accountId, status: updated.status, reason },
          { toolCallId: callId }
        );
      }
    } else {
      result = createToolCallError(`Tool "${name}" is not registered.`, {
        code: TOOL_CALL_ERROR_CODES.NOT_FOUND,
        toolCallId: callId,
      });
    }

    observeRecord(name, callId, args, result, Date.now() - startedAt);
    return result;
  };

  const manager: ToolManagementInterface = {
    listTools: () => ({ tools: [...AI_TOOL_DEFINITIONS] }),
    getToolDefinition: (name) =>
      AI_TOOL_DEFINITIONS.find((definition) => definition.name === name),
    hasTool: (name) =>
      AI_TOOL_DEFINITIONS.some((definition) => definition.name === name),
    async callTool(request) {
      return runTool(
        request.params.name,
        String(request.id ?? 'call-local'),
        request.params.arguments ?? {}
      );
    },
    async executeModelToolCall(call) {
      return runTool(
        call.name,
        String(call.id ?? 'call-model'),
        call.arguments ?? {}
      );
    },
  };

  return {
    approvalQueue,
    observeRecord,
    getAccounts: () => accounts,
    manager,
  };
}

export default function AISDKToolsPage() {
  const [accounts, setAccounts] = useState<Record<string, AccountState>>({});
  const [observations, setObservations] = useState<ToolObservationSinkRecord[]>(
    []
  );
  const [runtime] = useState<AIWorkbenchRuntime>(() =>
    createAIWorkbenchRuntime(
      (nextAccounts) => setAccounts(nextAccounts),
      (record) => setObservations((prev) => [record, ...prev].slice(0, 6))
    )
  );
  const callCounterRef = useRef(0);
  const [errorMode, setErrorMode] = useState<AISDKToolErrorMode>('result');
  const [executionOutput, setExecutionOutput] = useState<string>(
    'Trigger a simulated AI SDK v7 model tool call below.'
  );

  const pendingApprovals = useSyncExternalStore(
    (cb) => runtime.approvalQueue.store.subscribe(cb),
    () => runtime.approvalQueue.store.getSnapshot(),
    () => runtime.approvalQueue.store.getSnapshot()
  );

  const scope = useMemo(
    () =>
      createAISDKToolScope(runtime.manager, {
        sessionId: 'ai-sdk-demo-session',
        toolNames: ['get_account_summary', 'freeze_account'],
        needsApproval: ({ toolName }) => toolName === 'freeze_account',
        errorMode,
      }),
    [runtime.manager, errorMode]
  );

  const currentAccounts =
    Object.keys(accounts).length > 0 ? accounts : runtime.getAccounts();
  const account = currentAccounts['ACCT-42'];

  const simulateModelCall = async (
    toolName: 'get_account_summary' | 'freeze_account',
    input: Record<string, unknown>
  ) => {
    callCounterRef.current += 1;
    const toolCallId = `ai-call-${callCounterRef.current}`;

    const approvalDecision = scope.toolApproval
      ? await scope.toolApproval({
          toolCall: { toolName, input },
        })
      : 'not-applicable';

    if (approvalDecision === 'user-approval') {
      const definition = runtime.manager.getToolDefinition(toolName);
      if (!definition) return;
      setExecutionOutput(
        `Awaiting user approval for "${toolName}" (${toolCallId})...`
      );
      const resolution = await runtime.approvalQueue.request({
        request: toToolCallRequest({
          id: toolCallId,
          name: toolName,
          arguments: input,
        }),
        definition,
        context: {
          source: 'model',
          mode: 'agent',
          sessionId: 'ai-sdk-demo-session',
        },
      });
      if (resolution === 'deny') {
        setExecutionOutput(
          `Rejected by user approval queue: "${toolName}" (${toolCallId}) was not executed.`
        );
        return;
      }
    }

    const tool = scope.tools[toolName];
    if (!tool?.execute) return;

    try {
      const output = await tool.execute(input, {
        toolCallId,
        messages: [],
        context: undefined,
      });
      setExecutionOutput(JSON.stringify(output, null, 2));
    } catch (error) {
      if (error instanceof AISDKToolExecutionError) {
        setExecutionOutput(
          `AISDKToolExecutionError [${error.result.error?.code}]: ${error.message}`
        );
        return;
      }
      setExecutionOutput(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">@context-action/ai-sdk</Badge>
          <Badge variant="outline">@context-action/tool-protocol</Badge>
          <Badge variant="success">AI SDK v7 toolApproval</Badge>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">
          AI SDK v7 Tool Scope, Approval Queue &amp; Redacted Observability
        </h1>
        <p className="text-slate-600">
          Demonstrates <code>createAISDKToolScope</code> wrapping a canonical{' '}
          <code>ToolManagementInterface</code> into AI SDK v7 <code>tools</code>{' '}
          + <code>activeTools</code> + <code>toolApproval</code>, combined with{' '}
          <code>createToolApprovalQueue</code> and{' '}
          <code>createToolObservationSink</code>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. AI SDK Tool Scope &amp; Simulated Runner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
              <div>
                <code>scope.activeTools</code>:{' '}
                <strong data-testid="aisdk-active-tools">
                  {scope.activeTools.join(', ')}
                </strong>
              </div>
              <div>
                Account <code>ACCT-42</code>:{' '}
                <strong data-testid="account-status">
                  {account?.status ?? 'active'}
                </strong>{' '}
                (Balance: ${account?.balanceUsd ?? 0}, Owner: {account?.owner})
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  void simulateModelCall('get_account_summary', {
                    accountId: 'ACCT-42',
                  })
                }
              >
                Simulate Model Call: get_account_summary
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void simulateModelCall('freeze_account', {
                    accountId: 'ACCT-42',
                    reason: 'Suspicious login detected',
                  })
                }
              >
                Simulate Model Call: freeze_account
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  void simulateModelCall('get_account_summary', {
                    accountId: 'UNKNOWN-000',
                  })
                }
              >
                Simulate Failing Call (unknown account)
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setErrorMode((prev) =>
                    prev === 'result' ? 'throw' : 'result'
                  )
                }
              >
                errorMode: {errorMode}
              </Button>
            </div>

            {pendingApprovals.length > 0 && (
              <div
                className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2"
                data-testid="pending-approvals"
              >
                {pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex flex-col gap-2 text-sm text-amber-950"
                  >
                    <div>
                      Pending Approval: <strong>{approval.name}</strong> (
                      {approval.safeArgumentPreview})
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          runtime.approvalQueue.resolve(approval.id, 'allow')
                        }
                      >
                        Approve &amp; Execute
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          runtime.approvalQueue.resolve(approval.id, 'deny')
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <pre
              className="rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 overflow-x-auto"
              data-testid="aisdk-execution-output"
            >
              {executionOutput}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              2. Redacted Observability Stream (createToolObservationSink)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="space-y-2 max-h-80 overflow-y-auto"
              data-testid="aisdk-observations"
            >
              {observations.length === 0 ? (
                <div className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                  Run a simulated tool call to emit redacted metadata-only
                  observations.
                </div>
              ) : (
                observations.map((record, idx) => (
                  <pre
                    key={`${record.schemaVersion}-${idx}`}
                    className="rounded bg-slate-900 p-2 font-mono text-xs text-emerald-300 overflow-x-auto"
                  >
                    {record.serializedObservation}
                  </pre>
                ))
              )}
            </div>

            <CodeBlock size="sm">
              {`const scope = createAISDKToolScope(manager, {
  sessionId: 'ai-sdk-demo-session',
  toolNames: ['get_account_summary', 'freeze_account'],
  needsApproval: ({ toolName }) => toolName === 'freeze_account',
  errorMode: 'result',
});
// Forward scope.tools, scope.activeTools, and scope.toolApproval to generateText / streamText.`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
