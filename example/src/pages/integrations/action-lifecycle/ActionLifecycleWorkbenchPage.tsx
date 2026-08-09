import { useCallback, useState } from 'react';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  LifecycleContext,
  type RunMode,
  type TraceEntry,
} from './contexts/ActionLifecycleContext';
import { ActionLifecycleHandlerRegistry } from './handlers/ActionLifecycleHandlerRegistry';

const modeLabels: Record<RunMode, string> = {
  success: '정상 처리',
  invalid: '입력 검증 실패',
  blocked: '정책 차단',
};

function ActionLifecycleWorkbenchContent() {
  const [mode, setMode] = useState<RunMode>('success');
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [summary, setSummary] = useState<string>('아직 실행하지 않았습니다.');
  const [isRunning, setIsRunning] = useState(false);
  const { dispatchWithResult } = LifecycleContext.useActionDispatchWithResult();

  const record = useCallback((entry: Omit<TraceEntry, 'elapsedMs'>) => {
    setTrace((current) => [
      ...current,
      { ...entry, elapsedMs: performance.now() },
    ]);
  }, []);

  const run = async () => {
    setTrace([]);
    setSummary('Pipeline을 실행 중입니다…');
    setIsRunning(true);

    try {
      const result = await dispatchWithResult('run', {
        mode,
      });
      const completed = result.successResults.length;
      setSummary(
        result.aborted
          ? `중단됨: ${result.abortReason ?? '알 수 없는 이유'} (결과 ${completed}개 수집)`
          : `완료됨: 결과 ${completed}개를 수집했습니다.`
      );
    } catch (error) {
      setSummary(
        `실행 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <ActionLifecycleHandlerRegistry record={record}>
      <PageWithLogMonitor
        pageId="action-lifecycle-workbench"
        title="Action Lifecycle Workbench"
      >
        <div className="page-container max-w-6xl mx-auto p-6 space-y-6">
          <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-cyan-50 p-7">
            <Badge variant="primary">대표 데모</Badge>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Action Lifecycle Workbench
            </h1>
            <p className="mt-3 max-w-3xl text-slate-700">
              하나의 action이 검증, 정책, 비즈니스 작업, 감사 기록을 우선순위
              순서로 통과하는 과정을 확인합니다. v1의 guard, result, observer
              역할과 pipeline 중단 사유를 같은 화면에서 확인할 수 있습니다.
            </p>
          </section>

          <Card variant="outlined">
            <CardHeader>
              <CardTitle>1. 실행 시나리오 선택</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {(Object.keys(modeLabels) as RunMode[]).map((candidate) => (
                <Button
                  key={candidate}
                  variant={mode === candidate ? 'primary' : 'outline'}
                  disabled={isRunning}
                  onClick={() => setMode(candidate)}
                >
                  {modeLabels[candidate]}
                </Button>
              ))}
              <Button variant="success" loading={isRunning} onClick={run}>
                Pipeline 실행
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>2. Handler 타임라인</CardTitle>
              </CardHeader>
              <CardContent>
                {trace.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    실행하면 handler 순서와 반환 결과가 표시됩니다.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {trace.map((entry, index) => (
                      <li
                        key={`${entry.handler}-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-slate-900">
                            {index + 1}. {entry.handler}
                          </strong>
                          <span className="text-xs font-semibold text-indigo-700">
                            priority {entry.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                          {entry.detail}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          결과: {entry.status}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle>3. Dispatch 결과</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
                  {summary}
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• guard가 결과 handler보다 먼저 입력·정책을 검사</li>
                  <li>• `dispatchWithResult`로 result handler의 결과를 수집</li>
                  <li>• `controller.abort()`가 후속 result 처리를 중단</li>
                  <li>• observer는 최종 outcome을 감사 기록으로 남김</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWithLogMonitor>
    </ActionLifecycleHandlerRegistry>
  );
}

export function ActionLifecycleWorkbenchPage() {
  return (
    <LifecycleContext.Provider>
      <ActionLifecycleWorkbenchContent />
    </LifecycleContext.Provider>
  );
}

export default ActionLifecycleWorkbenchPage;
