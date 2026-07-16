import { toToolListRequest } from '@context-action/react';
import type { BoltStyleRegistry } from '../bolt-style-tool-context';
import {
  buildLocalAgentPlan,
  inferWorkspacePath,
  readResultRevision,
  revisionGuardedWorkspaceTools,
  revisionProducingWorkspaceTools,
} from '../local-agent-plan';
import type { AgentRunResult } from '../openrouter';
import { formatToolResultText } from '../tool-result-utils';
import { throwIfAborted } from '../tool-runtime-utils';
import { recordToolList } from '../tool-trace';
import { BrowserWorkspace } from '../workspace';
import { BrowserWorkspaceFileSystemAdapter } from '../workspace-filesystem';

export async function runLocalAgent(
  registry: BoltStyleRegistry,
  workspace: BrowserWorkspace,
  fileSystemAdapter: BrowserWorkspaceFileSystemAdapter,
  prompt: string,
  signal?: AbortSignal,
  sessionId?: string
): Promise<AgentRunResult> {
  const listedTools = registry.listTools(toToolListRequest());
  recordToolList(listedTools.tools.length, 'local', sessionId);
  const calls = buildLocalAgentPlan(
    prompt,
    !fileSystemAdapter.hasWritableFolder,
    workspace.getSnapshot().activePath
  );
  let plannedRevision = workspace.getSnapshot().revision;
  const toolNames: string[] = [];

  for (const [callIndex, call] of calls.entries()) {
    throwIfAborted(signal);
    const argumentsValue =
      revisionGuardedWorkspaceTools.has(call.name) &&
      call.arguments.expectedRevision === undefined
        ? { ...call.arguments, expectedRevision: plannedRevision }
        : call.arguments;
    const result = await registry.executeModelToolCall(
      {
        id: `local-model-${sessionId ?? 'run'}-${callIndex}-${call.name}`,
        name: call.name,
        arguments: argumentsValue,
      },
      {
        context: {
          source: 'local',
          mode: 'agent',
          ...(sessionId ? { sessionId } : {}),
          metadata: { provider: 'local-fallback' },
        },
        signal,
      }
    );
    throwIfAborted(signal);
    toolNames.push(call.name);
    if (result.isError) {
      const errorMessage = formatToolResultText(result);
      const revisionConflict =
        result.error?.code === 'WORKSPACE_REVISION_CONFLICT' ||
        errorMessage.includes('Workspace revision mismatch:');
      const completedSummary =
        toolNames.length > 1
          ? `Completed ${toolNames.slice(0, -1).join(', ')} before the failure. `
          : '';
      return {
        toolNames,
        response: `${completedSummary}${call.name} failed: ${errorMessage}`,
        failedTool: call.name,
        errorCode: result.error?.code,
        revisionConflict,
        failed: true,
        retryable: result.error?.retryable === true || revisionConflict,
      };
    }
    plannedRevision = readResultRevision(
      result,
      revisionProducingWorkspaceTools.has(call.name)
        ? workspace.getSnapshot().revision
        : plannedRevision
    );
  }

  return {
    toolNames,
    response:
      toolNames.length === 1 &&
      toolNames[0] === 'workspace.listFiles' &&
      /(delete|remove|삭제|지워)/i.test(prompt) &&
      /(file|파일)/i.test(prompt) &&
      !inferWorkspacePath(prompt)
        ? 'Which file should I delete? Include a path such as README.md.'
        : toolNames.length === 1 &&
            toolNames[0] === 'workspace.listFiles' &&
            /(download|export|다운로드|내려받|받아\s*줘)/i.test(prompt) &&
            !inferWorkspacePath(prompt)
          ? 'Which file should I download? Include a path such as README.md.'
          : `Local agent inspected the workspace, called ${toolNames.join(', ')}${toolNames.some((name) => name.startsWith('preview.') || revisionProducingWorkspaceTools.has(name)) ? ' and refreshed the sandbox preview.' : '.'}`,
  };
}
