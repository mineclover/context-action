import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ReactCompilerDemo } from '@/components/ReactCompilerTest';
import { Card, CardContent } from '@/components/ui';
import { useSourceLinkRegistration } from '@/hooks/useSourceLinkRegistration';

function HomePage() {
  // 🎯 소스 링크 등록
  useSourceLinkRegistration({
    id: 'home-page',
    name: 'Home Page',
    filePath: 'pages/HomePage.tsx',
    category: 'core',
    description:
      'Main landing page showcasing Context-Action framework examples',
    tags: ['homepage', 'overview', 'examples'],
  });
  return (
    <PageLayout
      title="Context-Action Framework Examples"
      description="Interactive examples demonstrating the Context-Action framework's capabilities. Learn through hands-on experience with action pipelines, store management, and React integration."
    >
      <Card variant="elevated" className="mb-8 border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
        <CardContent>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Recommended First Example
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">
                Start with the Implementation Playbook
              </h2>
              <p className="mt-3 text-slate-700 leading-relaxed">
                If you want the fastest route from architecture to working code,
                start with the canonical order form example. It ties Action,
                Store, and Ref boundaries to a real implementation and a real
                integration test.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Action + Store + Ref
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  File-by-file reading order
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Verified by Jest
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/patterns/implementation-playbook"
                className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open canonical example →
              </Link>
              <a
                href="https://mineclover.github.io/context-action/ko/examples/canonical-order-form"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Read example guide ↗
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 mb-8">
        <Card category="core" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Core ActionRegister
            </h3>
            <p className="text-gray-600 mb-4">
              Learn the fundamentals of action pipeline management and type-safe
              action dispatching.
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-danger-500 mr-2">•</span>
                Action registration and dispatching
              </li>
              <li className="flex items-start">
                <span className="text-danger-500 mr-2">•</span>
                Priority-based handler execution
              </li>
              <li className="flex items-start">
                <span className="text-danger-500 mr-2">•</span>
                Pipeline control and error handling
              </li>
            </ul>
            <Link
              to="/foundations/core/basics"
              className="inline-flex items-center text-danger-600 hover:text-danger-700 font-medium"
            >
              Explore Foundations →
            </Link>
          </CardContent>
        </Card>

        <Card category="store" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Store System
            </h3>
            <p className="text-gray-600 mb-4">
              Discover reactive state management with the built-in store system.
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-success-500 mr-2">•</span>
                Basic store operations (CRUD)
              </li>
              <li className="flex items-start">
                <span className="text-success-500 mr-2">•</span>
                Subscription patterns
              </li>
              <li className="flex items-start">
                <span className="text-success-500 mr-2">•</span>
                React integration with hooks
              </li>
            </ul>
            <Link
              to="/foundations/store/basics"
              className="inline-flex items-center text-success-600 hover:text-success-700 font-medium"
            >
              Explore Stores →
            </Link>
          </CardContent>
        </Card>

        <Card category="pipeline" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Pipeline Features
            </h3>
            <p className="text-gray-600 mb-4">
              Explore advanced pipeline flow control patterns including priority
              jumping, early returns, and complex branching logic.
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                Dynamic priority adjustment
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                Smart early return patterns
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                Business rule-driven routing
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                Real-time flow visualization
              </li>
            </ul>
            <Link
              to="/patterns/pipeline/flow-control"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
            >
              Explore Patterns →
            </Link>
          </CardContent>
        </Card>

        <Card category="react" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              React Integration
            </h3>
            <p className="text-gray-600 mb-4">
              See how the framework integrates seamlessly with React
              applications.
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Provider pattern implementation
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Context API integration
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Custom hooks for actions and stores
              </li>
            </ul>
            <Link
              to="/foundations/react/provider"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              Explore React →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardContent>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Getting Started
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Start with the{' '}
            <Link
              to="/patterns/implementation-playbook"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Implementation Playbook
            </Link>{' '}
            if you want the fastest path from architecture to working code. Then
            move to{' '}
            <Link
              to="/foundations/core/basics"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Foundations
            </Link>{' '}
            to understand the fundamental concepts, then explore{' '}
            <Link
              to="/performance/action-guard"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Store System
            </Link>{' '}
            for state management, and finally see how it all comes together with{' '}
            <Link
              to="/react/provider"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              React Integration
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      {/* React 컴파일러 테스트 섹션 */}
      <Card variant="elevated" className="mt-8">
        <CardContent>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🚀 React 컴파일러 테스트
          </h2>
          <p className="text-gray-600 mb-6">
            React 컴파일러가 자동으로 메모이제이션을 적용하는지 확인해보세요.
            React DevTools에서 "Memo ✨" 배지를 확인할 수 있습니다.
          </p>
          <ReactCompilerDemo />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

export default HomePage;
