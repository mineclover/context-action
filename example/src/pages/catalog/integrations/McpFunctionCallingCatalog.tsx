import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';
import {
  mcpExecutionStages,
  mcpFunctionCallingCommands,
  mcpStandaloneCommands,
  mcpToolManagementMethods,
} from '@/lib/mcp-function-calling-catalog';
import { downloadTextFile, writeClipboardText } from '@/lib/tool-call-trace';

const difficultyStyles = {
  Starter: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Workflow: 'bg-amber-100 text-amber-800 border-amber-200',
  Advanced: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function McpFunctionCallingCatalog() {
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  const showCommandFeedback = (feedback: string) => {
    setCommandFeedback(feedback);
    window.setTimeout(() => setCommandFeedback(null), 1600);
  };

  const copyCommand = async (commandId: string, prompt: string) => {
    try {
      await writeClipboardText(prompt);
      showCommandFeedback(`copy:${commandId}`);
    } catch {
      showCommandFeedback(`copy-failed:${commandId}`);
    }
  };

  const downloadCommand = (commandId: string, prompt: string) => {
    downloadTextFile(prompt, `mcp-command-${commandId}.txt`, 'text/plain');
    showCommandFeedback(`download:${commandId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="primary">MCP / FUNCTION CALLING</Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
                MCP Function Calling Catalog
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
                브라우저에서 모델이 도구를 발견하고, 스키마에 맞는 인자를
                만들고, ToolContext 핸들러를 실행하는 흐름을 명령문 단위로
                검증하는 전용 레퍼런스입니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/integrations/tool-context-ai"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                쇼케이스 열기 →
              </Link>
              <a
                href="https://mineclover.github.io/context-action/web-coding/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-cyan-300 bg-white px-5 py-3 text-sm font-semibold text-cyan-900 hover:bg-cyan-50"
              >
                Standalone Studio ↗
              </a>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
                Execution contract
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                한 번의 채팅이 툴체인이 되는 과정
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              MCP 스키마는 도구의 계약을 설명하고, ToolContext는 실제 실행과
              검증을 소유합니다. 아래 단계는 현재 브라우저 쇼케이스의 검증
              경계입니다.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {mcpExecutionStages.map((stage, index) => (
              <div
                key={stage.protocol}
                className="relative rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900">
                    {stage.label}
                  </h3>
                </div>
                <code className="mt-4 block rounded bg-slate-900 px-3 py-2 text-xs text-cyan-200">
                  {stage.protocol}
                </code>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">
                Standalone Web Studio
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-violet-950">
                실제 workspace tool-chain 레퍼런스
              </h2>
            </div>
            <a
              className="text-sm font-semibold text-violet-800 underline decoration-violet-300 underline-offset-4 hover:text-violet-950"
              href="https://mineclover.github.io/context-action/web-coding/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Studio에서 실행 ↗
            </a>
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-violet-900">
            아래 명령문은 추상 예제가 아니라 standalone Web Studio에 등록된
            workspace·preview 도구와 승인 경계를 기준으로 작성했습니다.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {mcpStandaloneCommands.map((command) => (
              <article
                className="flex flex-col rounded-xl border border-violet-200 bg-white p-5"
                key={command.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {command.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {command.description}
                    </p>
                  </div>
                  <Badge className={difficultyStyles[command.difficulty]}>
                    {command.difficulty}
                  </Badge>
                </div>
                <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                      Prompt
                    </span>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:border-violet-400"
                        onClick={() =>
                          void copyCommand(command.id, command.prompt)
                        }
                        type="button"
                      >
                        {commandFeedback === `copy:${command.id}`
                          ? '복사됨'
                          : commandFeedback === `copy-failed:${command.id}`
                            ? 'Download 사용'
                            : '명령문 복사'}
                      </button>
                      <button
                        className="rounded-full border border-violet-200 bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 hover:border-violet-400"
                        onClick={() =>
                          downloadCommand(command.id, command.prompt)
                        }
                        type="button"
                      >
                        {commandFeedback === `download:${command.id}`
                          ? '다운로드됨'
                          : '명령문 다운로드'}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-800">
                    {command.prompt}
                  </p>
                </div>
                <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-slate-800">사용 도구</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {command.tools.map((tool) => (
                        <code
                          className="rounded bg-slate-100 px-2 py-1 text-slate-700"
                          key={tool}
                        >
                          {tool}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      예상 실행 체인
                    </h4>
                    <p className="mt-2 leading-5 text-slate-600">
                      {command.expectedChain.join(' → ')}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Standard management interface
          </p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="text-2xl font-semibold text-cyan-950">
              Tool 정의와 실행 경계를 한 인터페이스로 관리
            </h2>
            <code className="text-xs text-cyan-800">
              ToolManagementInterface&lt;ToolDefinition&gt;
            </code>
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-cyan-900">
            포맷별 변환기와 실제 실행기를 분리해서 따로 관리하지 않고, 같은
            registry가 발견·조회·호출·결과 반환의 기준점이 됩니다.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {mcpToolManagementMethods.map((method) => (
              <div
                key={method.name}
                className="rounded-xl border border-cyan-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <code className="font-semibold text-cyan-950">
                    {method.name}()
                  </code>
                  <span className="rounded bg-cyan-100 px-2 py-1 text-[11px] font-semibold text-cyan-800">
                    {method.protocol}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {method.purpose}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
                Prompt library
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                바로 입력해볼 수 있는 명령문
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              복사한 명령문을 쇼케이스 채팅창에 붙여 넣고 예상 체인과
              비교하세요.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {mcpFunctionCallingCommands.map((command) => (
              <article
                key={command.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {command.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {command.description}
                    </p>
                  </div>
                  <Badge className={difficultyStyles[command.difficulty]}>
                    {command.difficulty}
                  </Badge>
                </div>

                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                      Prompt
                    </span>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void copyCommand(command.id, command.prompt)
                        }
                        className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:border-indigo-400"
                      >
                        {commandFeedback === `copy:${command.id}`
                          ? '복사됨'
                          : commandFeedback === `copy-failed:${command.id}`
                            ? 'Download 사용'
                            : '명령문 복사'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadCommand(command.id, command.prompt)
                        }
                        className="rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:border-indigo-400"
                      >
                        {commandFeedback === `download:${command.id}`
                          ? '다운로드됨'
                          : '명령문 다운로드'}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-800">
                    {command.prompt}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-slate-800">사용 도구</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {command.tools.map((tool) => (
                        <code
                          key={tool}
                          className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          {tool}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      예상 실행 체인
                    </h4>
                    <p className="mt-2 leading-6 text-slate-600">
                      {command.expectedChain.join(' → ')}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-lg font-semibold text-emerald-950">
              추천 테스트 순서
            </h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-emerald-900">
              <li>
                1. `read-only-state`로 도구 발견과 읽기 호출을 확인합니다.
              </li>
              <li>2. `add-and-confirm`으로 쓰기 후 결과 반환을 확인합니다.</li>
              <li>3. `inspect-update-heading`로 3단계 체인을 실행합니다.</li>
              <li>
                4. `safe-clear`로 파괴적 작업의 사전 확인 흐름을 검증합니다.
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-950">
              관찰 포인트
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-amber-900">
              <li>• 모델이 등록되지 않은 도구 이름을 생성하지 않는가</li>
              <li>• 인자가 Zod/JSON Schema 계약을 통과하는가</li>
              <li>• toolCallId가 호출과 결과 사이에서 보존되는가</li>
              <li>• ToolContext 핸들러 결과가 다음 모델 단계에 전달되는가</li>
              <li>• policy가 allow/ask/deny를 실제 실행 전에 적용하는가</li>
              <li>• 실패·중단 시 사용자에게 원인이 표시되는가</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
