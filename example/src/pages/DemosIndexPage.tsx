/**
 * @fileoverview Demos Index Page - Interactive demonstrations hub
 * 
 * Comprehensive showcase of Context-Action framework capabilities through
 * interactive demonstrations and real-world use cases.
 */

import { Link } from 'react-router-dom';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Badge } from '@/components/ui';

interface DemoItem {
  path: string;
  title: string;
  emoji: string;
  description: string;
  tags: string[];
  category: 'business' | 'performance' | 'interaction' | 'advanced';
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  features: string[];
  estimatedTime: string;
}

const demos: DemoItem[] = [
  // === AI/LLM Integration ===
  {
    path: '/integrations/tool-context-ai',
    title: 'ToolContext + AI SDK',
    emoji: '🤖',
    description: 'AI가 ToolContext를 통해 UI를 제어하는 완전한 데모. OpenRouter와 function calling 통합.',
    tags: ['AI/LLM', 'Function Calling', 'Tools', 'Real-time UI Control'],
    category: 'advanced',
    complexity: 'Advanced',
    features: ['ToolContext integration', 'OpenRouter API', 'Function calling', 'Real-time UI updates'],
    estimatedTime: '10-15분',
  },

  // === Store System ===
  {
    path: '/foundations/store/time-travel',
    title: 'Time Travel Store',
    emoji: '🕰️',
    description: 'Undo/Redo 기능을 갖춘 타임 트래블 스토어. 상태 히스토리 관리와 시간 여행 기능.',
    tags: ['Store', 'Undo/Redo', 'Time Travel', 'State History'],
    category: 'interaction',
    complexity: 'Intermediate',
    features: ['Undo/Redo support', 'History management', 'State snapshots', 'Position tracking'],
    estimatedTime: '5-10분',
  },
  {
    path: '/foundations/store/time-travel-context',
    title: 'Time Travel Context Pattern',
    emoji: '⏪',
    description: 'createTimeTravelStoreContext를 사용한 컨텍스트 패턴. Patch 기반 최적화 포함.',
    tags: ['Store', 'Context Pattern', 'Patch Optimization', 'Selective Subscription'],
    category: 'advanced',
    complexity: 'Advanced',
    features: ['Context pattern', 'useStorePath hook', 'Patch-based optimization', 'Render count reduction'],
    estimatedTime: '10-15분',
  },
  {
    path: '/foundations/store/basics',
    title: 'Store Basics',
    emoji: '📦',
    description: '스토어 시스템의 기본 사용법. createStore, useStoreValue 등 핵심 API.',
    tags: ['Store', 'Basics', 'State Management', 'Subscription'],
    category: 'interaction',
    complexity: 'Beginner',
    features: ['Store creation', 'Value subscription', 'State updates', 'Selector usage'],
    estimatedTime: '3-5분',
  },

  // === Business Examples ===
  {
    path: '/demos/chat',
    title: 'Real-time Chat',
    emoji: '💬',
    description: '실시간 채팅 시스템 with auto-scroll, message history, and user management',
    tags: ['Real-time', 'Chat', 'Auto-scroll', 'Store Management'],
    category: 'business',
    complexity: 'Intermediate',
    features: ['Real-time messaging', 'Auto-scroll', 'Message history', 'User management'],
    estimatedTime: '5-10분',
  },
  {
    path: '/integrations/advanced/form-builder',
    title: 'Dynamic Form Builder',
    emoji: '📝',
    description: '동적 폼 빌더 with validation, conditional fields, and complex state management',
    tags: ['Form', 'Validation', 'Dynamic Fields', 'Complex State'],
    category: 'business',
    complexity: 'Advanced',
    features: ['Dynamic field generation', 'Real-time validation', 'Conditional logic', 'Form state management'],
    estimatedTime: '10-15분',
  },

  // === Performance ===
  {
    path: '/demos/action-priority',
    title: 'Action Priority',
    emoji: '⚡',
    description: '우선순위 기반 액션 실행 시스템 with performance metrics',
    tags: ['Priority', 'Performance', 'Metrics', 'Queue Management'],
    category: 'performance',
    complexity: 'Advanced',
    features: ['Priority-based execution', 'Performance tracking', 'Queue management', 'Metrics visualization'],
    estimatedTime: '10-15분',
  },
  {
    path: '/performance/mouse-events',
    title: 'High-Frequency Mouse Events',
    emoji: '🖱️',
    description: '120fps 마우스 이벤트 처리 with Context-Action. 성능 비교 및 최적화.',
    tags: ['Mouse Events', 'High-Frequency', 'Performance', 'Real-time'],
    category: 'performance',
    complexity: 'Advanced',
    features: ['120fps event handling', 'Context Store pattern', 'Non-reactive updates', 'Performance comparison'],
    estimatedTime: '10-15분',
  },
  {
    path: '/performance/memoization',
    title: 'Memoization Patterns',
    emoji: '🧠',
    description: '메모이제이션을 통한 성능 최적화. useMemo, useCallback 활용 패턴.',
    tags: ['Memoization', 'Performance', 'React Optimization', 'Re-render Prevention'],
    category: 'performance',
    complexity: 'Intermediate',
    features: ['useMemo patterns', 'useCallback optimization', 'Selector memoization', 'Component memoization'],
    estimatedTime: '5-10분',
  },

  // === Patterns ===
  {
    path: '/patterns/layered-architecture',
    title: 'Layered Architecture (6-Layer)',
    emoji: '🏗️',
    description: '6레이어 아키텍처 패턴. Handler Injection과 순수 비즈니스 로직 분리.',
    tags: ['Architecture', '6-Layer', 'Clean Code', 'Separation of Concerns'],
    category: 'advanced',
    complexity: 'Advanced',
    features: ['6-layer separation', 'Handler injection', 'Pure business logic', 'Props-based DI'],
    estimatedTime: '15-20분',
  },
  {
    path: '/patterns/pipeline/flow-control',
    title: 'Flow Control Pipeline',
    emoji: '🔄',
    description: '플로우 제어 파이프라인. 복잡한 비동기 워크플로우 관리.',
    tags: ['Pipeline', 'Flow Control', 'Async', 'Workflow'],
    category: 'advanced',
    complexity: 'Advanced',
    features: ['Pipeline execution', 'Flow control', 'Abort handling', 'Result collection'],
    estimatedTime: '10-15분',
  },
  {
    path: '/patterns/conditional',
    title: 'Conditional Patterns',
    emoji: '🎯',
    description: '조건부 실행 패턴 모음. 권한, 유효성 검사, 피처 토글 등.',
    tags: ['Conditional', 'Permission', 'Validation', 'Feature Toggle'],
    category: 'interaction',
    complexity: 'Intermediate',
    features: ['Permission-based execution', 'Form validation', 'Workflow steps', 'Feature toggles'],
    estimatedTime: '10-15분',
  },

  // === React Integration ===
  {
    path: '/react/useActionWithResult',
    title: 'useActionWithResult Hook',
    emoji: '✨',
    description: 'Action 결과를 직접 반환받는 훅. 비동기 결과 처리와 상태 관리.',
    tags: ['React Hook', 'Action Result', 'Async', 'Type Safety'],
    category: 'interaction',
    complexity: 'Intermediate',
    features: ['Result return', 'Async handling', 'Error management', 'Type-safe actions'],
    estimatedTime: '5-10분',
  },
  {
    path: '/react/imperativeRef',
    title: 'Imperative Ref Pattern',
    emoji: '🎯',
    description: 'useImperativeHandle과 Ref Context 통합. 명령형 컴포넌트 제어.',
    tags: ['Ref', 'Imperative Handle', 'Component Control', 'Context'],
    category: 'interaction',
    complexity: 'Advanced',
    features: ['Imperative handle', 'Ref context', 'Component methods', 'Cross-component control'],
    estimatedTime: '10-15분',
  },

  // === Utilities ===
  {
    path: '/utilities/dev-tools/logger',
    title: 'Logger Demo',
    emoji: '📋',
    description: '개발 도구용 로거 시스템. 구조화된 로깅과 필터링.',
    tags: ['Logger', 'Dev Tools', 'Debugging', 'Structured Logging'],
    category: 'interaction',
    complexity: 'Beginner',
    features: ['Structured logging', 'Log filtering', 'Log levels', 'Console integration'],
    estimatedTime: '3-5분',
  },
];

const categories = [
  { key: 'business', label: '비즈니스 로직', emoji: '🏢', color: 'blue' },
  { key: 'performance', label: '성능 최적화', emoji: '⚡', color: 'green' },
  { key: 'interaction', label: '사용자 인터랙션', emoji: '🎯', color: 'purple' },
  { key: 'advanced', label: '고급 기능', emoji: '🚀', color: 'orange' },
];

const complexityColors = {
  Beginner: 'bg-green-100 text-green-800 border-green-200',
  Intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Advanced: 'bg-red-100 text-red-800 border-red-200',
};

export default function DemosIndexPage() {
  return (
    <PageWithLogMonitor
      pageId="demos-index"
      title="🎭 Context-Action Demos"
    >
      <div className="page-container">
        <div className="max-w-6xl mx-auto p-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl mb-8 border border-purple-200">
            <div className="flex items-start gap-6">
              <div className="text-4xl">🎭</div>
              <div>
                <h1 className="text-3xl font-bold text-purple-900 mb-4">
                  Context-Action Interactive Demos
                </h1>
                <p className="text-purple-800 text-lg mb-6">
                  Context-Action 프레임워크의 실용적인 데모들을 통해 실제 사용 사례를 학습하세요.
                  각 데모는 특정 기능이나 패턴을 집중적으로 보여주며, 실제 프로젝트에서 바로 적용할 수 있습니다.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-3">
                      🚀 주요 특징
                    </h3>
                    <ul className="text-purple-700 space-y-2 text-sm">
                      <li>• <strong>실시간 데모</strong>: 즉시 실행 가능한 인터랙티브 예제</li>
                      <li>• <strong>실용적 사례</strong>: 실제 프로젝트에서 사용되는 패턴</li>
                      <li>• <strong>단계별 학습</strong>: 초급부터 고급까지 체계적 학습</li>
                      <li>• <strong>성능 최적화</strong>: 최적화 기법과 모범 사례</li>
                      <li>• <strong>코드 예제</strong>: 복사 가능한 실제 코드</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-purple-900 mb-3">
                      📋 학습 가이드
                    </h3>
                    <ul className="text-purple-700 space-y-2 text-sm">
                      <li>• <strong>초급자</strong>: Chat Demo부터 시작</li>
                      <li>• <strong>중급자</strong>: Action Priority Demo로 성능 학습</li>
                      <li>• <strong>고급자</strong>: 모든 데모를 통한 심화 학습</li>
                      <li>• <strong>개발자</strong>: 코드 분석과 커스터마이징</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">📂 카테고리별 데모</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {categories.map((category) => {
                const categoryDemos = demos.filter(demo => demo.category === category.key);
                return (
                  <div
                    key={category.key}
                    className={`p-4 rounded-lg border-2 border-${category.color}-200 bg-${category.color}-50 hover:bg-${category.color}-100 transition-colors`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{category.emoji}</span>
                      <h3 className="font-semibold text-gray-800">{category.label}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {categoryDemos.length}개 데모
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {categoryDemos.slice(0, 2).map((demo) => (
                        <span
                          key={demo.path}
                          className="text-xs bg-white px-2 py-1 rounded border"
                        >
                          {demo.emoji} {demo.title.split(' ')[0]}
                        </span>
                      ))}
                      {categoryDemos.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{categoryDemos.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demo Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">🎮 인터랙티브 데모</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {demos.map((demo) => (
                <Link
                  key={demo.path}
                  to={demo.path}
                  className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl group-hover:scale-110 transition-transform">
                      {demo.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800 group-hover:text-purple-600">
                          {demo.title}
                        </h3>
                        <Badge
                          className={`text-xs ${complexityColors[demo.complexity]}`}
                        >
                          {demo.complexity}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">
                        {demo.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {demo.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">주요 기능:</span>
                          <ul className="text-gray-600 text-xs mt-1 space-y-1">
                            {demo.features.map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            예상 시간: {demo.estimatedTime}
                          </span>
                          <span className="text-purple-500 font-medium group-hover:underline">
                            데모 시작하기 →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Learning Path */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">🎯 학습 경로</h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🌱</div>
                  <h3 className="font-semibold text-lg mb-2 text-green-800">
                    초급자
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    기본 개념과 간단한 데모부터 시작
                  </p>
                  <div className="space-y-1">
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Chat Demo
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl mb-3">🚀</div>
                  <h3 className="font-semibold text-lg mb-2 text-blue-800">
                    중급자
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    성능 최적화와 고급 패턴 학습
                  </p>
                  <div className="space-y-1">
                    <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Action Priority Demo
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl mb-3">🎓</div>
                  <h3 className="font-semibold text-lg mb-2 text-purple-800">
                    고급자
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    모든 데모를 통한 심화 학습
                  </p>
                  <div className="space-y-1">
                    <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      모든 데모
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">✨ 모범 사례</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-lg mb-3 text-green-800">
                  ✅ 권장사항
                </h3>
                <ul className="text-green-700 space-y-2 text-sm">
                  <li>• 데모를 순서대로 따라해보세요</li>
                  <li>• 코드를 직접 수정해보며 학습하세요</li>
                  <li>• 브라우저 개발자 도구를 활용하세요</li>
                  <li>• 성능 메트릭을 주의깊게 관찰하세요</li>
                  <li>• 실제 프로젝트에 적용해보세요</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg mb-3 text-blue-800">
                  💡 팁
                </h3>
                <ul className="text-blue-700 space-y-2 text-sm">
                  <li>• 각 데모의 소스 코드를 확인하세요</li>
                  <li>• 네트워크 탭에서 API 호출을 관찰하세요</li>
                  <li>• React DevTools로 상태 변화를 추적하세요</li>
                  <li>• 성능 탭에서 렌더링 성능을 측정하세요</li>
                  <li>• 다른 브라우저에서도 테스트해보세요</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4">🔗 추가 자료</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a href="/foundations" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
                📖 기초 개념
              </a>
              <a href="/performance" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
                ⚡ 성능 최적화
              </a>
              <a href="/patterns" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
                🎨 패턴 가이드
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}
