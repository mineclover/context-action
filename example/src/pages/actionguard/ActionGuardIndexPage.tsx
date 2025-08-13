/**
 * @fileoverview Action Guard Index Page
 *
 * Action Guard 섹션의 메인 인덱스 페이지입니다.
 * 각 데모 페이지로의 네비게이션을 제공합니다.
 */

import { Link } from 'react-router-dom';
import { DemoCard } from '../../components/ui';

const demos = [
  {
    path: '/actionguard/search',
    title: 'Search Demo',
    description:
      'Real-time search with debouncing (500ms delay) to optimize API calls and reduce server load',
    icon: '🔍',
    technique: 'Debouncing',
    useCase: 'Search inputs, auto-complete, form validation',
  },
  {
    path: '/actionguard/scroll',
    title: 'Scroll Demo',
    description:
      'Smooth scroll event handling with throttling (100ms interval) for performance optimization',
    icon: '📜',
    technique: 'Throttling',
    useCase: 'Scroll events, window resize, infinite scroll',
  },
  {
    path: '/actionguard/api-blocking',
    title: 'API Blocking Demo',
    description:
      'Prevent duplicate API calls with 2-second blocking window and rate limiting',
    icon: '🚫',
    technique: 'Blocking',
    useCase: 'API calls, form submission, button clicks',
  },
  {
    path: '/actionguard/mouse-events',
    title: 'Mouse Events Demo',
    description:
      'Optimize mouse move tracking with throttling (50ms) and movement pattern analysis',
    icon: '🖱️',
    technique: 'Throttling',
    useCase: 'Mouse tracking, drag & drop, drawing apps',
  },
  {
    path: '/actionguard/test',
    title: 'Dispatch Options Test',
    description:
      'Comprehensive testing of all dispatch options: throttle, debounce, priority, and performance metrics',
    icon: '🧪',
    technique: 'All Techniques',
    useCase: 'Testing, benchmarking, performance analysis',
  },
  {
    path: '/actionguard/priority-performance',
    title: 'Priority Performance Test',
    description:
      'Multi-instance priority test with isolated stores for stress testing and performance comparison',
    icon: '⚡',
    technique: 'Priority System',
    useCase: 'Performance testing, stress testing, scalability',
  },
  {
    path: '/actionguard/throttle-comparison',
    title: 'Throttle Comparison',
    description:
      'Side-by-side comparison of manual vs Context-Action throttling with detailed metrics',
    icon: '📊',
    technique: 'Throttling Analysis',
    useCase: 'Performance comparison, optimization validation',
  },
];

export function ActionGuardIndexPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>🛡️ Action Guard System</h1>
        <p className="page-description">
          Learn how to implement debouncing, throttling, and action blocking
          patterns to optimize user experience and prevent excessive action
          execution.
        </p>
      </header>

      <div className="space-y-6">
        {/* 데모 링크 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demos.map((demo) => (
            <Link
              key={demo.path}
              to={demo.path}
              className="block hover:no-underline"
            >
              <DemoCard className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{demo.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {demo.title}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        {demo.technique}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {demo.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      <strong>Use Cases:</strong> {demo.useCase}
                    </div>
                  </div>
                </div>
              </DemoCard>
            </Link>
          ))}
        </div>

        {/* 개념 설명 */}
        <DemoCard variant="info">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Action Guard Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Debouncing</h4>
              <p>
                Delays execution until after a period of inactivity. Perfect for
                search inputs and form validation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Throttling</h4>
              <p>
                Limits execution to a fixed interval. Ideal for scroll, resize,
                and mouse move events.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Blocking</h4>
              <p>
                Prevents duplicate execution for a period. Essential for API
                calls and form submissions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Rate Limiting
              </h4>
              <p>
                Restricts the number of executions per time window. Useful for
                API quota management.
              </p>
            </div>
          </div>
        </DemoCard>

        {/* Architecture 설명 */}
        <DemoCard variant="info">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Architecture Pattern
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              Each demo page follows the{' '}
              <strong>Context → Data/Action → Hook → View</strong> architecture:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">→</span>
                <div>
                  <strong>Context Layer:</strong> Defines the abstract domain
                  and contracts
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">→</span>
                <div>
                  <strong>Data/Action Layer:</strong> Manages state (Store) and
                  business logic (Actions)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">→</span>
                <div>
                  <strong>Hook Layer:</strong> Bridges Data/Action with View for
                  bidirectional data flow
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">→</span>
                <div>
                  <strong>View Layer:</strong> Renders UI components using data
                  and actions from hooks
                </div>
              </li>
            </ul>
          </div>
        </DemoCard>
      </div>
    </div>
  );
}

export default ActionGuardIndexPage;
