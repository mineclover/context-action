/**
 * @fileoverview Priority Performance View Component - View Layer
 * 
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import React from 'react';
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
        <h1>🚀 Priority Test Performance Comparison</h1>
        <p className="page-description">
          완전히 분리된 Priority Test 인스턴스들을 이용한 성능 테스트. 토스트
          기능이 비활성화되어 순수한 액션 파이프라인 성능을 측정합니다.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Link
            to="/actionguard"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            📋 ActionGuard 인덱스 페이지 보기
          </Link>
          <div className="text-sm text-gray-500">
            현재 인스턴스: {instanceCount}개
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
            <Button
              onClick={addInstance}
              disabled={!canOperate}
              size="sm"
            >
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

      {/* 성능 테스트 안내 */}
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
          <li>• 점프 패턴: 90→70, 55→45→15→95</li>
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
            • <strong>색상 변화</strong>: 실행 횟수에 따른 우선순위별 색상
            농도 관찰
          </li>
          <li>
            • <strong>점프 패턴</strong>: 15→95 무한루프로 인한 색상 변화 확인
          </li>
          <li>
            • <strong>성능 비교</strong>: 여러 인스턴스 간의 성능 차이 분석
          </li>
        </ul>
      </div>
    </div>
  );
}