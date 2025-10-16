import { PageWithLogMonitor } from '@/components/LogMonitor';
import { SourceLink } from '@/components/ui/SourceLink';
import { useSourceLinkRegistration } from '@/hooks/useSourceLinkRegistration';
import { AdvancedCodeExamples } from './components/AdvancedCodeExamples';
import { AsyncDemo } from './components/AsyncDemo';
import { BasicActionsDemo } from './components/BasicActionsDemo';
import { PriorityDemo } from './components/PriorityDemo';

// 데모 컴포넌트 - 각각 격리된 ActionRegister를 사용
function CoreAdvancedDemo() {
  // 🎯 소스 링크 등록
  useSourceLinkRegistration({
    id: 'core-advanced-page',
    name: 'Core Advanced Page',
    filePath: 'pages/foundations/core/AdvancedPage.tsx',
    category: 'core',
    description:
      'Advanced ActionRegister features with priority, async, and error handling',
    tags: [
      'core',
      'advanced',
      'priority',
      'async',
      'error-handling',
      'actionregister',
    ],
  });

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ActionRegister 고급 기능
          </h2>
          <p className="text-gray-600">
            우선순위 시스템, 비동기 처리, 에러 핸들링 등 ActionRegister의 고급
            기능들을 살펴봅니다. 각 데모는 독립적인 ActionRegister 인스턴스를
            사용하여 서로 격리되어 있습니다.
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <SourceLink
            filePath="pages/foundations/core/AdvancedPage.tsx"
            variant="badge"
          />
        </div>
      </div>

      {/* 기본 액션 데모 */}
      <BasicActionsDemo />

      {/* 우선순위 데모 */}
      <PriorityDemo />

      {/* 비동기 데모 */}
      <AsyncDemo />

      {/* 사용법 섹션 - MVVM 패턴에 따라 모듈화 */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          📖 ActionRegister 고급 사용법
        </h3>
        <p className="text-gray-600 mb-6">
          다양한 패턴과 실제 사용 사례를 통해 ActionRegister의 강력한 기능들을
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
      <CoreAdvancedDemo />
    </PageWithLogMonitor>
  );
}

export default CoreAdvancedPage;
