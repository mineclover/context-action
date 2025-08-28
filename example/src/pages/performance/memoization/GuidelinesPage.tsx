import React from 'react'
import { Link } from 'react-router-dom'

const GuidelinesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/performance" className="text-gray-500 hover:text-gray-700">
                  Performance
                </Link>
              </li>
              <li>
                <Link to="/performance/memoization" className="text-gray-500 hover:text-gray-700">
                  Memoization
                </Link>
              </li>
              <li className="text-gray-900">Guidelines</li>
            </ol>
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            메모이제이션 가이드라인
          </h1>
          
          <p className="text-gray-600 mb-6">
            Context-Action에서 메모이제이션을 언제, 어떻게 사용해야 하는지에 대한 실용적인 가이드라인입니다.
          </p>

          <div className="space-y-8">
            {/* 언제 메모이제이션을 사용해야 하는가 */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                언제 메모이제이션을 사용해야 하는가
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded p-4">
                  <h3 className="font-medium text-green-900 mb-2">✅ 사용해야 하는 경우</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 복잡한 계산이나 변환 작업</li>
                    <li>• 큰 객체나 배열의 생성</li>
                    <li>• API 호출 결과의 후처리</li>
                    <li>• 자주 변경되지 않는 값</li>
                    <li>• 렌더링 성능이 중요한 컴포넌트</li>
                  </ul>
                </div>
                <div className="bg-red-50 rounded p-4">
                  <h3 className="font-medium text-red-900 mb-2">❌ 사용하지 말아야 하는 경우</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• 간단한 값 할당</li>
                    <li>• 자주 변경되는 값</li>
                    <li>• 메모리 사용량이 중요한 경우</li>
                    <li>• 의존성이 복잡한 경우</li>
                    <li>• 성능 개선 효과가 미미한 경우</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Context-Action에서의 메모이제이션 패턴 */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Context-Action에서의 메모이제이션 패턴
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Action Handler에서의 메모이제이션</h3>
                  <p className="text-sm text-blue-700">
                    Action handler 내에서 복잡한 계산이나 객체 생성을 메모이제이션하여 성능을 최적화할 수 있습니다.
                  </p>
                </div>
                <div className="bg-purple-50 rounded p-4">
                  <h3 className="font-medium text-purple-900 mb-2">Store 값의 메모이제이션</h3>
                  <p className="text-sm text-purple-700">
                    Store에서 파생된 복잡한 값을 메모이제이션하여 불필요한 재계산을 방지할 수 있습니다.
                  </p>
                </div>
                <div className="bg-yellow-50 rounded p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">컴포넌트 렌더링 최적화</h3>
                  <p className="text-sm text-yellow-700">
                    React.memo와 useMemo를 조합하여 컴포넌트 렌더링 성능을 최적화할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 성능 측정 방법 */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                성능 측정 방법
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded p-4">
                  <h3 className="font-medium text-gray-900 mb-2">측정 지표</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 렌더링 횟수</li>
                    <li>• 렌더링 시간</li>
                    <li>• 메모리 사용량</li>
                    <li>• CPU 사용률</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <h3 className="font-medium text-gray-900 mb-2">측정 도구</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• React DevTools Profiler</li>
                    <li>• Chrome DevTools Performance</li>
                    <li>• Context-Action 내장 성능 모니터링</li>
                    <li>• 커스텀 성능 측정 훅</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuidelinesPage
