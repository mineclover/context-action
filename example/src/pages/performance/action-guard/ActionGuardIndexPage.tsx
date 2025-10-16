/**
 * @fileoverview ActionGuard Index Page - ActionGuard 관련 데모들의 인덱스 페이지
 */

import { Link } from 'react-router-dom';

const actionGuardDemos = [
  {
    path: '/actionguard/search',
    title: '🔍 Advanced Search Demo',
    description: '고급 검색 기능과 abort 가능한 검색 시스템',
    tags: ['Search', 'Abort', 'Performance'],
  },
  {
    path: '/actionguard/scroll',
    title: '📜 Advanced Scroll Demo',
    description: '무한 스크롤과 가상화된 스크롤링 시스템',
    tags: ['Scroll', 'Virtualization', 'Performance'],
  },
  {
    path: '/actionguard/api-blocking',
    title: '🚫 API Blocking Demo',
    description: 'API 요청 차단 및 중복 요청 방지 시스템',
    tags: ['API', 'Blocking', 'Optimization'],
  },
  {
    path: '/actionguard/mouse-events',
    title: '🖱️ Mouse Events Demo',
    description: '고급 마우스 이벤트 처리 및 최적화',
    tags: ['Mouse', 'Events', 'Interaction'],
  },
  {
    path: '/actionguard/priority-performance-advanced',
    title: '🚀 Priority Performance Advanced',
    description: '다중 인스턴스 우선순위 성능 테스트 (고급)',
    tags: ['Priority', 'Multi-Instance', 'Advanced'],
  },
  {
    path: '/actionguard/throttle-comparison',
    title: '⚖️ Throttle Comparison Demo',
    description: '다양한 쓰로틀링 방법 비교 분석',
    tags: ['Throttle', 'Performance', 'Comparison'],
  },
  {
    path: '/actionguard/conditional-execution',
    title: '🔄 Conditional Execution (All-in-One)',
    description: '통합 조건부 실행 데모 - 모든 패턴을 한 페이지에서',
    tags: ['Conditional', 'All-in-One', 'Legacy'],
  },
  {
    path: '/actionguard/conditional',
    title: '🎯 Conditional Execution Patterns',
    description:
      '패턴별 분리된 조건부 실행 데모 - 환경, 기능플래그, 권한, 비즈니스룰',
    tags: ['Conditional', 'Patterns', 'Focused'],
  },
  {
    path: '/actionguard/advanced-filtering',
    title: '🎛️ Advanced Filtering Demo',
    description:
      '고급 필터링 패턴 - 핸들러 ID, 우선순위, 커스텀 로직, 결합 필터링',
    tags: ['Filtering', 'Advanced', 'Control'],
  },
];

/**
 * ActionGuard 인덱스 페이지
 */
export default function ActionGuardIndexPage() {
  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <header className="page-header">
        <h1>🛡️ ActionGuard Demos</h1>
        <p className="page-description">
          Context-Action 프레임워크의 고급 기능들을 다룬 ActionGuard 데모
          모음입니다. 성능 최적화, 이벤트 처리, API 관리 등 다양한 실무
          시나리오를 다룹니다.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            🏠 홈으로 돌아가기
          </Link>
          <div className="text-sm text-gray-500">
            총 <strong>{actionGuardDemos.length}개</strong> 데모
          </div>
        </div>
      </header>

      {/* 데모 목록 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {actionGuardDemos.map((demo, index) => (
          <Link
            key={demo.path}
            to={demo.path}
            className="group block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 p-6"
          >
            {/* 제목 */}
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-3">
              {demo.title}
            </h3>

            {/* 설명 */}
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {demo.description}
            </p>

            {/* 태그들 */}
            <div className="flex flex-wrap gap-2">
              {demo.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 화살표 아이콘 */}
            <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
              <span className="text-sm font-medium">데모 보기</span>
              <svg
                className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* 추가 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">
          💡 ActionGuard 시스템
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <div>
            <strong>성능 최적화:</strong> 고급 성능 측정 및 최적화 기법들을 실제
            시나리오에서 테스트
          </div>
          <div>
            <strong>이벤트 관리:</strong> 복잡한 사용자 상호작용과 이벤트 처리
            시스템
          </div>
          <div>
            <strong>API 최적화:</strong> 중복 요청 방지, 캐싱, 에러 처리 등 API
            관리 시스템
          </div>
          <div>
            <strong>실무 적용:</strong> 실제 프로덕션 환경에서 활용 가능한
            패턴들
          </div>
        </div>
      </div>
    </div>
  );
}
