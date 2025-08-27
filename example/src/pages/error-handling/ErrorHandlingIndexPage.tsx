/**
 * Error Handling Examples - 포괄적인 에러 처리 시스템 데모
 * 
 * 이 페이지는 Context-Action 프레임워크의 통합 에러 처리 시스템을 보여줍니다:
 * - ContextActionErrorBoundary를 사용한 컴포넌트 에러 처리
 * - DevTools와 연동된 에러 로깅 및 모니터링
 * - Store 에러 상태 관리 및 복구
 * - 비동기 작업 에러 처리 및 재시도 로직
 * - 사용자 친화적 에러 메시지 및 복구 옵션
 */

import React from 'react';
import { Link } from 'react-router-dom';

export function ErrorHandlingIndexPage() {
  const examples = [
    {
      path: '/error-handling/basic',
      title: 'Basic Error Boundary',
      description: '기본 ErrorBoundary 사용법과 컴포넌트 에러 처리',
      features: ['컴포넌트 에러 캐치', '폴백 UI 렌더링', '에러 정보 로깅']
    },
    {
      path: '/error-handling/store-errors',
      title: 'Store Error Management',
      description: 'Store 레벨에서의 에러 상태 관리 및 복구',
      features: ['에러 상태 Store', '자동 에러 복구', '에러 카테고리 분류']
    },
    {
      path: '/error-handling/async-errors',
      title: 'Async Error Handling',
      description: '비동기 작업의 에러 처리 및 재시도 메커니즘',
      features: ['재시도 로직', '타임아웃 처리', '네트워크 에러 복구']
    },
    {
      path: '/error-handling/devtools-integration',
      title: 'DevTools Integration',
      description: 'DevTools와 연동된 실시간 에러 모니터링',
      features: ['실시간 에러 로깅', '성능 영향 분석', '에러 히스토리 추적']
    },
    {
      path: '/error-handling/user-experience',
      title: 'User Experience Patterns',
      description: '사용자 친화적 에러 처리 UX 패턴',
      features: ['토스트 알림', '인라인 에러 메시지', '복구 액션 버튼']
    },
    {
      path: '/error-handling/comprehensive',
      title: 'Comprehensive Demo',
      description: '실제 애플리케이션 시나리오의 종합적 에러 처리',
      features: ['E-commerce 시나리오', '다중 에러 타입', '전체 시스템 통합']
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🛡️ Error Handling System
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Context-Action 프레임워크의 통합 에러 처리 시스템을 다양한 실제 시나리오로 
          체험해보세요. ErrorBoundary, DevTools 연동, Store 에러 관리, 비동기 에러 처리 등 
          프로덕션 레벨의 에러 처리 패턴들을 학습할 수 있습니다.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {examples.map((example, index) => (
          <Link
            key={example.path}
            to={example.path}
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {example.title}
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Demo {index + 1}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              {example.description}
            </p>
            
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                주요 기능
              </h4>
              <ul className="space-y-1">
                {example.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          💡 학습 포인트
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium text-yellow-800 mb-2">에러 처리 아키텍처</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• ErrorBoundary를 활용한 컴포넌트 에러 격리</li>
              <li>• Store 기반 에러 상태 중앙 집중 관리</li>
              <li>• DevTools 연동 실시간 에러 모니터링</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-yellow-800 mb-2">실용적 패턴</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 자동 재시도 로직 구현</li>
              <li>• 사용자 친화적 에러 메시지</li>
              <li>• 그라데풀 에러 복구 메커니즘</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          🔧 개발 도구 활용
        </h3>
        <p className="text-sm text-blue-700">
          각 예제에서 브라우저 개발자 도구의 Redux DevTools Extension을 열어두면 
          실시간으로 에러 로깅, 상태 변화, 액션 디스패치를 모니터링할 수 있습니다.
        </p>
      </div>
    </div>
  );
}