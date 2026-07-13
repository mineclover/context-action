import { type KeyboardEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import styles from './LiveCodeEditorPage.module.css';
import { LiveUsecaseProviders } from './usecase/LiveUsecaseHandlers';
import { LiveUsecaseRecipe } from './usecase/LiveUsecaseRecipe';

type ExampleId = 'pipeline' | 'tools' | 'store' | 'usecase';
type ScenarioId = 'success' | 'invalid' | 'blocked';

interface ExampleDefinition {
  label: string;
  file: string;
  description: string;
  code: string;
}

interface PreviewEvent {
  label: string;
  time: string;
  status: 'success' | 'blocked' | 'error';
}

const examples: Record<ExampleId, ExampleDefinition> = {
  pipeline: {
    label: 'Action pipeline',
    file: 'checkout-action.ts',
    description: '우선순위 handler와 abort 경계를 편집해 봅니다.',
    code: `import { createActionContext } from '@context-action/react';

const Checkout = createActionContext({ name: 'Checkout' });

Checkout.useActionHandler('submit', validateCart, {
  id: 'validate-cart',
  priority: 100,
  blocking: true,
});

Checkout.useActionHandler('submit', async ({ cartId }, controller) => {
  const result = await reserveInventory(cartId);
  if (!result.ok) controller.abort('재고 부족');
  return result;
}, { id: 'reserve-inventory', priority: 60, blocking: true });

const result = await dispatchWithResult('submit', { cartId: 'cart-42' });
console.log(result.successResults);`,
  },
  tools: {
    label: 'ToolContext',
    file: 'ui-tools.tsx',
    description: '툴 호출을 UI action으로 연결하는 흐름입니다.',
    code: `import { createToolContext } from '@context-action/react';

const UITools = createToolContext('UITools');

UITools.useToolHandler('set_theme', ({ theme }) => {
  document.documentElement.dataset.theme = theme;
  return { applied: theme };
}, { id: 'theme-switcher' });

await UITools.dispatch('set_theme', { theme: 'violet' });`,
  },
  store: {
    label: 'Store selector',
    file: 'cart-store.ts',
    description: '선택 구독으로 필요한 값만 렌더링합니다.',
    code: `import { createStore } from '@context-action/react';

const cartStore = createStore({
  items: [],
  coupon: null,
});

const total = useStoreSelector(
  cartStore,
  (state) => state.items.reduce(sumItems, 0),
);

cartStore.setState((state) => ({
  ...state,
  coupon: 'WELCOME10',
}));`,
  },
  usecase: {
    label: 'Usecase boundary',
    file: 'access-request-recipe.tsx',
    description:
      'Contract, runtime, facade, recipe를 하나의 feature scope에서 연결합니다.',
    code: `// contract: typed intent + state
type AccessRequestAction =
  | { type: 'submitRequest' }
  | { type: 'changeReason'; reason: string };

// runtime: Context-Action orchestration
const AccessRequest = createActionContext<AccessRequestActions>(
  'AccessRequest',
);
const Stores = createStoreContext('AccessRequestStores', {
  workflow: { initialValue: initialWorkflow },
});

// facade: stable commands + view model
const vm = useAccessRequestFacade();

// recipe: Astryx props, no business rules
<Drawer isOpen={vm.isOpen} onClose={vm.commands.close}>
  <Textarea
    value={vm.reason}
    onChange={vm.commands.changeReason}
  />
  <Button isLoading={vm.isBusy} onClick={vm.commands.submit} />
</Drawer>`,
  },
};

const scenarioLabels: Record<ScenarioId, string> = {
  success: 'happy path',
  invalid: 'invalid input',
  blocked: 'policy blocked',
};

const baseEvents: Record<ScenarioId, PreviewEvent[]> = {
  success: [
    { label: 'input-validation passed', time: '0.4ms', status: 'success' },
    { label: 'policy-guard passed', time: '1.2ms', status: 'success' },
    {
      label: 'business-operation completed',
      time: '18.6ms',
      status: 'success',
    },
    { label: 'audit-log recorded', time: '19.0ms', status: 'success' },
  ],
  invalid: [
    { label: 'input-validation rejected', time: '0.3ms', status: 'error' },
    {
      label: 'dispatch aborted: invalid payload',
      time: '0.5ms',
      status: 'error',
    },
  ],
  blocked: [
    { label: 'input-validation passed', time: '0.4ms', status: 'success' },
    { label: 'policy-guard blocked', time: '1.4ms', status: 'blocked' },
    {
      label: 'dispatch aborted: policy guard',
      time: '1.6ms',
      status: 'blocked',
    },
  ],
};

function LiveCodeEditorContent() {
  const [activeExample, setActiveExample] = useState<ExampleId>('pipeline');
  const [code, setCode] = useState(examples.pipeline.code);
  const [scenario, setScenario] = useState<ScenarioId>('success');
  const [isRunning, setIsRunning] = useState(false);
  const [runState, setRunState] = useState<'ready' | 'running' | ScenarioId>(
    'ready'
  );
  const [copied, setCopied] = useState(false);

  const currentExample = examples[activeExample];
  const lineNumbers = useMemo(
    () => code.split('\n').map((_, index) => index + 1),
    [code]
  );
  const events = baseEvents[scenario];

  const selectExample = (nextExample: ExampleId) => {
    setActiveExample(nextExample);
    setCode(examples[nextExample].code);
    setRunState('ready');
  };

  const runPreview = () => {
    setIsRunning(true);
    setRunState('running');
    window.setTimeout(() => {
      setIsRunning(false);
      setRunState(scenario);
    }, 420);
  };

  const resetCode = () => {
    setCode(currentExample.code);
    setRunState('ready');
  };

  const copyCode = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const nextCode = `${code.slice(0, start)}  ${code.slice(end)}`;
    setCode(nextCode);
    window.requestAnimationFrame(() => {
      target.selectionStart = start + 2;
      target.selectionEnd = start + 2;
    });
  };

  const resultMessage =
    runState === 'ready'
      ? 'Run preview를 누르면 현재 scenario가 action pipeline을 통과합니다.'
      : runState === 'running'
        ? '현재 코드를 기반으로 preview를 실행 중입니다…'
        : runState === 'success'
          ? '완료됨 · 4개 handler 결과를 수집했습니다.'
          : runState === 'invalid'
            ? '중단됨 · 입력 검증 실패가 후속 handler를 막았습니다.'
            : '중단됨 · policy guard가 비즈니스 작업 전에 요청을 차단했습니다.';

  return (
    <PageWithLogMonitor pageId="live-code-editor" title="Live Code Editor">
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.hero}>
            <div>
              <span className={styles.eyebrow}>
                Context-Action / playground
              </span>
              <h1>Live code, visible behavior.</h1>
              <p>
                현재 예제 환경의 action, tool, store 계약을 작은 브라우저
                workbench로 옮겼습니다. 코드를 편집하고, scenario를 바꾸고, 같은
                화면에서 실행 trace를 확인하세요.
              </p>
            </div>
            <div
              className={styles.environment}
              aria-label="Current environment"
            >
              <span>React 19.2</span>
              <span>Vite 8.1</span>
              <span>pnpm 10.30</span>
              <span>@context-action/react</span>
            </div>
          </section>

          <section
            className={styles.workbench}
            aria-label="Live code editor workbench"
          >
            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <label htmlFor="example-select">Example</label>
                <select
                  id="example-select"
                  className={styles.select}
                  value={activeExample}
                  onChange={(event) =>
                    selectExample(event.target.value as ExampleId)
                  }
                >
                  {Object.entries(examples).map(([id, example]) => (
                    <option key={id} value={id}>
                      {example.label} · {example.file}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.toolbarActions}>
                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={resetCode}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={copyCode}
                >
                  {copied ? 'Copied' : 'Copy code'}
                </button>
                <button
                  type="button"
                  className={`${styles.toolbarButton} ${styles.runButton}`}
                  onClick={runPreview}
                  disabled={isRunning}
                >
                  {isRunning ? 'Running…' : '▶ Run preview'}
                </button>
              </div>
            </div>

            <div className={styles.body}>
              <section className={styles.editorPane} aria-label="Code editor">
                <div className={styles.tabs}>
                  <button
                    type="button"
                    className={`${styles.tab} ${styles.activeTab}`}
                  >
                    {currentExample.file}
                  </button>
                  <span className={styles.tab}>TypeScript</span>
                </div>
                <div className={styles.editor}>
                  <div className={styles.lineNumbers} aria-hidden="true">
                    {lineNumbers.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                  <textarea
                    aria-label={`${currentExample.file} source editor`}
                    className={styles.codeInput}
                    spellCheck={false}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    onKeyDown={handleEditorKeyDown}
                  />
                </div>
                <div className={styles.statusbar}>
                  <span>UTF-8 · LF</span>
                  <span>{code.split('\n').length} lines · editable</span>
                </div>
              </section>

              <section className={styles.previewPane} aria-label="Live preview">
                <div className={styles.previewHeader}>
                  <h2>Live preview</h2>
                  <span className={styles.liveBadge}>safe runner</span>
                </div>
                <div className={styles.previewContent}>
                  <div className={styles.previewCard}>
                    {activeExample === 'usecase' ? (
                      <LiveUsecaseProviders>
                        <LiveUsecaseRecipe />
                      </LiveUsecaseProviders>
                    ) : (
                      <>
                        <div className={styles.previewCardHeader}>
                          <div>
                            <h3>{currentExample.label}</h3>
                            <p>{currentExample.description}</p>
                          </div>
                          <span>browser demo</span>
                        </div>
                        <div
                          className={styles.scenarioBar}
                          aria-label="Preview scenarios"
                        >
                          {(Object.keys(scenarioLabels) as ScenarioId[]).map(
                            (candidate) => (
                              <button
                                type="button"
                                key={candidate}
                                className={`${styles.scenarioButton} ${
                                  scenario === candidate
                                    ? styles.scenarioButtonActive
                                    : ''
                                }`}
                                onClick={() => setScenario(candidate)}
                              >
                                {scenarioLabels[candidate]}
                              </button>
                            )
                          )}
                        </div>
                        <button
                          type="button"
                          className={styles.previewRun}
                          onClick={runPreview}
                          disabled={isRunning}
                        >
                          {isRunning
                            ? 'Dispatching action…'
                            : 'Run current scenario'}
                        </button>

                        <div className={styles.output}>
                          <div className={styles.outputHeader}>
                            <span>dispatch output</span>
                            <span className={styles.outputState}>
                              {runState}
                            </span>
                          </div>
                          <div className={styles.eventList}>
                            {runState === 'ready' || runState === 'running' ? (
                              <div className={styles.event}>
                                <span className={styles.eventDot} />
                                <span>
                                  {runState === 'running'
                                    ? 'dispatching…'
                                    : 'waiting for run'}
                                </span>
                                <span className={styles.eventTime}>—</span>
                              </div>
                            ) : (
                              events.map((event) => (
                                <div className={styles.event} key={event.label}>
                                  <span
                                    className={`${styles.eventDot} ${
                                      event.status === 'blocked'
                                        ? styles.eventDotBlocked
                                        : event.status === 'error'
                                          ? styles.eventDotError
                                          : ''
                                    }`}
                                  />
                                  <span>{event.label}</span>
                                  <span className={styles.eventTime}>
                                    {event.time}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div
                          className={`${styles.resultBox} ${
                            runState === 'blocked'
                              ? styles.resultBoxBlocked
                              : runState === 'invalid'
                                ? styles.resultBoxError
                                : ''
                          }`}
                        >
                          {resultMessage}
                        </div>
                      </>
                    )}
                  </div>

                  <div className={styles.notes}>
                    <div className={styles.note}>
                      <strong>Action pipeline</strong>
                      <span>
                        priority + blocking으로 실행 경계를 확인합니다.
                      </span>
                    </div>
                    <div className={styles.note}>
                      <strong>Typed result</strong>
                      <span>
                        dispatch 결과와 abort reason을 함께 노출합니다.
                      </span>
                    </div>
                    <div className={styles.note}>
                      <strong>Local only</strong>
                      <span>
                        이 데모는 외부 API 없이 브라우저에서 동작합니다.
                      </span>
                    </div>
                  </div>
                  <p className={styles.footnote}>
                    코드는 편집 가능한 예제 계약이고 preview는 안전한 시나리오
                    runner입니다. 실제 애플리케이션에서는 handler를 서비스
                    로직에 연결해 사용합니다.{' '}
                    <Link to="/integrations/action-lifecycle">
                      Lifecycle workbench 보기 →
                    </Link>{' '}
                    ·{' '}
                    <Link to="/patterns/implementation-playbook/access-request">
                      전체 playbook 보기 →
                    </Link>
                  </p>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </PageWithLogMonitor>
  );
}

export default LiveCodeEditorContent;
