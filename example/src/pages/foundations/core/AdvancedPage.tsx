import { PageWithLogMonitor } from '@/components/LogMonitor';
import { SourceLink } from '@/components/ui/SourceLink';
import { useSourceLinkRegistration } from '@/hooks/useSourceLinkRegistration';
import { AdvancedCodeExamples } from './components/AdvancedCodeExamples';
import { AsyncDemo } from './components/AsyncDemo';
import { BasicActionsDemo } from './components/BasicActionsDemo';
import { PriorityDemo } from './components/PriorityDemo';
import { CoreAdvancedProviders } from './handlers/CoreAdvancedHandlerRegistry';
import { useCoreAdvancedViewModel } from './hooks/useCoreAdvancedViewModel';

function CoreAdvancedDemo() {
  useSourceLinkRegistration({
    id: 'core-advanced-page',
    name: 'Core Advanced Page',
    filePath: 'pages/foundations/core/AdvancedPage.tsx',
    category: 'core',
    description:
      'Advanced ActionRegister features with page-scoped priority, async, and error handling',
    tags: [
      'core',
      'advanced',
      'priority',
      'async',
      'error-handling',
      'actionregister',
      'context-layered',
    ],
  });

  const { count, priorityResults, asyncResults, actions } =
    useCoreAdvancedViewModel();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ActionRegister 고급 기능
          </h2>
          <p className="text-gray-600">
            우선순위 시스템, 비동기 처리, 에러 핸들링을 page-scoped Action/Store
            Context와 handler registry로 분리해 살펴봅니다. 세 데모는 같은 page
            context 안에서 독립 action과 store slice를 사용합니다.
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <SourceLink
            filePath="pages/foundations/core/AdvancedPage.tsx"
            variant="badge"
          />
        </div>
      </div>

      <BasicActionsDemo
        count={count}
        onIncrement={actions.increment}
        onMultiply={actions.multiply}
        onDivide={actions.divide}
        onDivideByZero={actions.divideByZero}
        onError={actions.throwError}
      />

      <PriorityDemo
        results={priorityResults}
        onRun={actions.runPriorityTest}
        onClear={actions.clearPriorityResults}
      />

      <AsyncDemo
        results={asyncResults}
        onRunSingle={() => void actions.runSingleAsync()}
        onRunMultiple={() => void actions.runMultipleAsync()}
        onClear={actions.clearAsyncResults}
      />

      <div className="mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          📖 ActionRegister 고급 사용법
        </h3>
        <p className="text-gray-600 mb-6">
          다양한 패턴과 실제 사용 사례를 통해 ActionRegister의 고급 기능들을
          살펴보세요. 각 예제는 실무에서 바로 적용 가능한 패턴들입니다.
        </p>
        <AdvancedCodeExamples />
      </div>
    </div>
  );
}

function CoreAdvancedPage() {
  return (
    <PageWithLogMonitor
      pageId="core-advanced"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <CoreAdvancedProviders>
        <CoreAdvancedDemo />
      </CoreAdvancedProviders>
    </PageWithLogMonitor>
  );
}

export default CoreAdvancedPage;
