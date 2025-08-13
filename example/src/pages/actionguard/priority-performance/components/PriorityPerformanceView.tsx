/**
 * @fileoverview Priority Performance View Component - View Layer
 *
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui';
import PriorityTestInstance from '../../performance/PriorityTestInstance';
import { usePriorityPerformanceLogic } from '../hooks/usePriorityPerformanceLogic';

/**
 * 우선순위 성능 테스트 View 컴포넌트
 *
 * Hook Layer를 통해 데이터와 액션을 받아 UI를 렌더링합니다.
 */
export function PriorityPerformanceView() {
  const {
    performanceState,
    addInstance,
    removeInstance,
    resetInstances,
    canOperate,
    instanceCount,
    canRemove,
  } = usePriorityPerformanceLogic();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header className="page-header">
        <h1>⚡ Priority Performance Test</h1>
        <p className="page-description">
          Multi-instance priority test system for stress testing and scalability
          analysis. Each instance runs completely isolated with its own Store
          Registry, allowing performance comparison and stress testing with{' '}
          <strong>multiple priority handlers</strong>
          running simultaneously. Toast notifications are disabled for pure
          performance measurement.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Link
            to="/actionguard"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            📋 Back to ActionGuard Index
          </Link>
          <div className="text-sm text-gray-500">
            Active Instances: <strong>{instanceCount}</strong>
          </div>
        </div>
      </header>

      {/* 인스턴스 관리 컨트롤 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            테스트 인스턴스 관리
          </h2>
          <div className="flex gap-2">
            <Button onClick={addInstance} disabled={!canOperate} size="sm">
              ➕ 인스턴스 추가
            </Button>
            <Button
              onClick={resetInstances}
              variant="secondary"
              disabled={!canOperate}
              size="sm"
            >
              🔄 기본값으로 리셋
            </Button>
          </div>
        </div>
      </div>

      {/* 성능 테스트 인스턴스들 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {performanceState.instances.map((instance) => (
          <div key={instance.id} className="relative">
            {canRemove && (
              <button
                onClick={() => removeInstance(instance.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 z-10 transition-colors"
                title="인스턴스 제거"
              >
                ×
              </button>
            )}
            <PriorityTestInstance
              title={instance.title}
              instanceId={instance.id}
            />
          </div>
        ))}
      </div>

      {/* 우선순위 실행 시스템 설명 */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="font-semibold text-indigo-900 mb-3">
          🎯 우선순위 실행 시스템
        </h3>
        <div className="text-sm text-indigo-800 space-y-2">
          <div>
            <strong>실행 순서:</strong> 높은 우선순위 → 낮은 우선순위 (95 → 90 →
            70 → 55 → 45 → 30 → 25 → 15 → 10)
          </div>
          <div>
            <strong>점프 시스템:</strong> 특정 조건에서 다른 우선순위로 점프하여
            실행
          </div>
          <ul className="ml-4 space-y-1">
            <li>• P90 → P70 점프 (조건부)</li>
            <li>• P70 → P25 점프 (조건부)</li>
            <li>• P55 → P45 점프 (조건부)</li>
            <li>• P45 → P15 점프 (조건부)</li>
            <li>• P30 → P10 점프 (조건부) - P30은 직접 실행되지 않음</li>
            <li>• P15 → P95 점프 (무한 루프 방지 조건 적용)</li>
          </ul>
          <div>
            <strong>지연 평가:</strong> 점프 조건은 런타임에 실시간으로 평가되어
            동적 실행 경로 결정
          </div>
          <div>
            <strong>루프 방지:</strong> 무한 점프를 방지하기 위한 조건부 로직과
            실행 횟수 제한 적용
          </div>
        </div>
      </div>

      {/* 성능 테스트 특징 */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">
          ⚡ 성능 테스트 특징
        </h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• 토스트 알림 완전 비활성화로 순수 성능 측정</li>
          <li>• 각 인스턴스는 완전히 독립적인 Store Registry 사용</li>
          <li>• 동적 인스턴스 추가로 스트레스 테스트 가능</li>
          <li>• 콘솔 로그 최소화로 성능 영향 제거</li>
          <li>• 간소화된 UI로 메모리 사용량 최적화</li>
          <li>• 우선순위 그리드로 실시간 실행 패턴 시각화</li>
        </ul>
      </div>

      {/* 스트레스 테스트 방법 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          🧪 스트레스 테스트 방법
        </h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>
            1. <strong>기본 테스트</strong>: 2개 인스턴스로 기본 성능 측정
          </li>
          <li>
            2. <strong>스트레스 테스트</strong>: 인스턴스를 5-10개까지 추가
          </li>
          <li>
            3. <strong>대용량 핸들러</strong>: 각 인스턴스에서 "일괄 추가"
            버튼으로 100개 핸들러 추가
          </li>
          <li>
            4. <strong>동시 실행</strong>: 모든 인스턴스에서 동시에 "성능
            테스트" 실행
          </li>
          <li>
            5. <strong>모니터링</strong>: 브라우저 개발자 도구로 메모리/CPU
            사용량 확인
          </li>
          <li>
            6. <strong>한계 테스트</strong>: 브라우저가 버틸 수 있는 최대
            인스턴스 수 찾기
          </li>
        </ol>
      </div>

      {/* 성능 분석 팁 */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2">💡 성능 분석 팁</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>
            • <strong>메모리 사용량</strong>: 인스턴스 수 × 핸들러 수에 비례
          </li>
          <li>
            • <strong>CPU 사용량</strong>: 동시 실행 시 멀티코어 활용도 확인
          </li>
          <li>
            • <strong>실행 패턴 관찰</strong>: 우선순위 그리드에서 색상 농도
            변화로 실행 횟수 파악
          </li>
          <li>
            • <strong>점프 시각화</strong>: 황색 점프 표시(⚫)를 통해 점프 경로
            추적
          </li>
          <li>
            • <strong>P30 미실행</strong>: P30은 점프 경유지로만 사용되어 직접
            실행되지 않음 확인
          </li>
          <li>
            • <strong>루프 방지 확인</strong>: P15→P95 점프가 무한 루프 방지
            조건에 의해 제어됨
          </li>
          <li>
            • <strong>지연 평가 효과</strong>: 실시간 조건 변화에 따른 점프 경로
            변화 관찰
          </li>
          <li>
            • <strong>성능 비교</strong>: 여러 인스턴스 간의 실행 패턴 및 성능
            차이 분석
          </li>
        </ul>
      </div>
    </div>
  );
}
