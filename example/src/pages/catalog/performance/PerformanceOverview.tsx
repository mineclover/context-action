import { Link } from 'react-router-dom';

export default function PerformanceOverview() {
  return (
    <div className="catalog-overview p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">⚡ Performance</h1>
        <p className="text-xl text-gray-700 mb-6">
          성능 최적화, 액션 가드 시스템, 그리고 우선순위 기반 실행에 대해 학습합니다.
        </p>
      </div>

      <div className="learning-path bg-yellow-50 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">🎯 성능 최적화 경로</h2>
        <ol className="space-y-3">
          <li className="flex items-center">
            <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">1</span>
            <div>
              <Link 
                to="/performance/action-guard" 
                className="text-yellow-600 hover:text-yellow-800 font-medium text-lg"
              >
                Action Guard 시스템
              </Link>
              <p className="text-gray-600">중복 액션 방지 및 성능 보호</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">2</span>
            <div>
              <Link 
                to="/performance/priority/advanced" 
                className="text-yellow-600 hover:text-yellow-800 font-medium text-lg"
              >
                Priority 시스템
              </Link>
              <p className="text-gray-600">우선순위 기반 액션 실행</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">3</span>
            <div>
              <Link 
                to="/performance/mouse-events" 
                className="text-yellow-600 hover:text-yellow-800 font-medium text-lg"
              >
                Mouse Events 최적화
              </Link>
              <p className="text-gray-600">고빈도 이벤트 처리 최적화</p>
            </div>
          </li>
        </ol>
      </div>

      <div className="categories grid md:grid-cols-3 gap-6">
        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🛡️ Action Guard</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/performance/action-guard" className="text-yellow-600 hover:underline">
                Guard 개요
              </Link>
            </li>
            <li>
              <Link to="/performance/action-guard/search" className="text-yellow-600 hover:underline">
                Search Protection
              </Link>
            </li>
            <li>
              <Link to="/performance/action-guard/scroll" className="text-yellow-600 hover:underline">
                Scroll Optimization
              </Link>
            </li>
            <li>
              <Link to="/performance/action-guard/api-blocking" className="text-yellow-600 hover:underline">
                API Blocking
              </Link>
            </li>
            <li>
              <Link to="/performance/action-guard/throttle-comparison" className="text-yellow-600 hover:underline">
                Throttle Comparison
              </Link>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🎯 Priority</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/performance/priority/advanced" className="text-yellow-600 hover:underline">
                Priority System
              </Link>
            </li>
            <li>
              <Link to="/performance/priority/demo" className="text-yellow-600 hover:underline">
                Priority Demo
              </Link>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🖱️ Mouse Events</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/performance/mouse-events" className="text-yellow-600 hover:underline">
                Mouse Events Index
              </Link>
            </li>
            <li>
              <Link to="/performance/mouse-events/enhanced-context-store" className="text-yellow-600 hover:underline">
                Enhanced Context Store
              </Link>
            </li>
            <li>
              <Link to="/performance/mouse-events/context-store-action" className="text-yellow-600 hover:underline">
                Context Store Action
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="performance-metrics bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold mb-3">📊 성능 지표</h3>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-600">99%</div>
            <div className="text-sm text-gray-600">중복 액션 차단</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">5x</div>
            <div className="text-sm text-gray-600">성능 향상</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">60fps</div>
            <div className="text-sm text-gray-600">부드러운 UI</div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🚀 성능 최적화 팁</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Action Guard를 활용해 중복 액션을 방지하세요</li>
          <li>Priority 시스템으로 중요한 액션을 우선 실행하세요</li>
          <li>마우스 이벤트는 적절한 throttling을 적용하세요</li>
          <li>성능 모니터링 도구를 활용해 실시간으로 확인하세요</li>
        </ul>
      </div>
    </div>
  );
}