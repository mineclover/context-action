import { Link } from 'react-router-dom';

export default function UtilitiesOverview() {
  return (
    <div className="catalog-overview p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🛠️ Utilities</h1>
        <p className="text-xl text-gray-700 mb-6">
          개발 생산성 향상과 디버깅을 위한 도구들을 학습합니다.
        </p>
      </div>

      <div className="learning-path bg-orange-50 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">🔧 개발 도구 활용법</h2>
        <ol className="space-y-3">
          <li className="flex items-center">
            <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">1</span>
            <div>
              <Link 
                to="/utilities/dev-tools/logger" 
                className="text-orange-600 hover:text-orange-800 font-medium text-lg"
              >
                로깅 시스템
              </Link>
              <p className="text-gray-600">개발 과정의 로그 추적과 디버깅</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">2</span>
            <div>
              <Link 
                to="/utilities/dev-tools/toast-config" 
                className="text-orange-600 hover:text-orange-800 font-medium text-lg"
              >
                토스트 시스템
              </Link>
              <p className="text-gray-600">사용자 피드백과 알림 관리</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">3</span>
            <div>
              <Link 
                to="/utilities/dev-tools/store-scenarios" 
                className="text-orange-600 hover:text-orange-800 font-medium text-lg"
              >
                스토어 시나리오
              </Link>
              <p className="text-gray-600">상태 관리 테스트와 시뮬레이션</p>
            </div>
          </li>
        </ol>
      </div>

      <div className="categories grid md:grid-cols-2 gap-6">
        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🔧 Dev Tools</h3>
          <p className="text-sm text-gray-600 mb-4">
            개발 과정에서 유용한 도구들과 생산성 향상 유틸리티
          </p>
          <ul className="space-y-2">
            <li>
              <Link to="/utilities/dev-tools/logger" className="text-orange-600 hover:underline">
                📝 Logger System
              </Link>
              <span className="text-xs text-gray-500 ml-2">Debug & Monitoring</span>
            </li>
            <li>
              <Link to="/utilities/dev-tools/toast-config" className="text-orange-600 hover:underline">
                🍞 Toast Config
              </Link>
              <span className="text-xs text-gray-500 ml-2">User Feedback</span>
            </li>
            <li>
              <Link to="/utilities/dev-tools/store-scenarios" className="text-orange-600 hover:underline">
                🏪 Store Scenarios
              </Link>
              <span className="text-xs text-gray-500 ml-2">State Testing</span>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🧪 Testing</h3>
          <p className="text-sm text-gray-600 mb-4">
            테스팅과 품질 보증을 위한 도구들
          </p>
          <ul className="space-y-2">
            <li>
              <Link to="/utilities/testing/enhanced-search" className="text-orange-600 hover:underline">
                🔍 Enhanced Search
              </Link>
              <span className="text-xs text-gray-500 ml-2">Search Testing</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="tool-features bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold mb-4">⚡ 도구의 특징</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🚀</div>
            <h4 className="font-medium mb-1">생산성 향상</h4>
            <p className="text-sm text-gray-600">개발 속도와 효율성 개선</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h4 className="font-medium mb-1">디버깅 지원</h4>
            <p className="text-sm text-gray-600">문제 진단과 해결 도구</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-medium mb-1">모니터링</h4>
            <p className="text-sm text-gray-600">실시간 상태 추적</p>
          </div>
        </div>
      </div>

      <div className="development-workflow bg-white border border-gray-200 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold mb-4">🔄 개발 워크플로우</h3>
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 font-semibold">1</span>
            </div>
            <h4 className="font-medium">개발</h4>
            <p className="text-sm text-gray-600">코드 작성과 구현</p>
          </div>
          <div className="text-orange-400">→</div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 font-semibold">2</span>
            </div>
            <h4 className="font-medium">디버깅</h4>
            <p className="text-sm text-gray-600">로거와 모니터링</p>
          </div>
          <div className="text-orange-400">→</div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 font-semibold">3</span>
            </div>
            <h4 className="font-medium">테스팅</h4>
            <p className="text-sm text-gray-600">품질 검증</p>
          </div>
          <div className="text-orange-400">→</div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 font-semibold">4</span>
            </div>
            <h4 className="font-medium">배포</h4>
            <p className="text-sm text-gray-600">프로덕션 릴리즈</p>
          </div>
        </div>
      </div>

      <div className="best-practices bg-blue-50 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold mb-4">📋 모범 사례</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-600 mb-2">🎯 로깅 전략</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 적절한 로그 레벨 사용</li>
              <li>• 구조화된 로그 메시지</li>
              <li>• 성능에 미치는 영향 최소화</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-600 mb-2">🧪 테스팅 접근법</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 단위 테스트 우선</li>
              <li>• 통합 테스트 보완</li>
              <li>• 사용자 시나리오 테스트</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">💡 유틸리티 활용 팁</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>개발 초기부터 로깅 시스템을 구축하세요</li>
          <li>사용자 피드백을 위한 토스트 시스템을 활용하세요</li>
          <li>상태 변화를 시각화하여 디버깅 효율성을 높이세요</li>
          <li>도구들을 조합하여 완전한 개발 워크플로우를 구성하세요</li>
        </ul>
      </div>
    </div>
  );
}