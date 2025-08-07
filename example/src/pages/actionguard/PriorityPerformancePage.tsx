import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PriorityTestInstance from './performance/PriorityTestInstance';

const PriorityPerformancePage = () => {
  const [instances, setInstances] = useState([
    { id: 'instance-a', title: '🔴 Priority Test Instance A' },
    { id: 'instance-b', title: '🔵 Priority Test Instance B' }
  ]);

  const addInstance = useCallback(() => {
    const colors = ['🟢', '🟡', '🟠', '🟣', '⚫', '⚪', '🔲', '🔳'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const instanceNumber = instances.length + 1;
    
    setInstances(prev => [...prev, {
      id: `instance-${instanceNumber}`,
      title: `${randomColor} Priority Test Instance ${String.fromCharCode(64 + instanceNumber)}`
    }]);
  }, [instances.length]);

  const removeInstance = useCallback((instanceId: string) => {
    setInstances(prev => prev.filter(instance => instance.id !== instanceId));
  }, []);

  const resetInstances = useCallback(() => {
    setInstances([
      { id: 'instance-a', title: '🔴 Priority Test Instance A' },
      { id: 'instance-b', title: '🔵 Priority Test Instance B' }
    ]);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Priority Test Performance Comparison
        </h1>
        <p className="text-gray-600 mb-3">
          완전히 분리된 Priority Test 인스턴스들을 이용한 성능 테스트. 
          토스트 기능이 비활성화되어 순수한 액션 파이프라인 성능을 측정합니다.
        </p>
        <div className="flex items-center gap-4">
          <Link 
            to="/actionguard/priority-test"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            📋 원본 Priority Test 페이지 보기
          </Link>
          <div className="text-sm text-gray-500">
            현재 인스턴스: {instances.length}개
          </div>
        </div>
      </div>

      {/* 인스턴스 관리 컨트롤 */}
      <div className="p-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">테스트 인스턴스 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={addInstance}
              className="btn btn-primary text-sm px-3 py-2"
            >
              ➕ 인스턴스 추가
            </button>
            <button
              onClick={resetInstances}
              className="btn btn-secondary text-sm px-3 py-2"
            >
              🔄 기본값으로 리셋
            </button>
          </div>
        </div>
      </div>

      {/* 성능 테스트 인스턴스들 */}
      <div className="px-6 pb-6">
        <div className={`grid gap-4 ${
          instances.length === 1 ? 'grid-cols-1' :
          instances.length === 2 ? 'grid-cols-2' :
          instances.length <= 4 ? 'grid-cols-2' :
          instances.length <= 6 ? 'grid-cols-3' :
          'grid-cols-4'
        }`}>
          {instances.map((instance) => (
            <div key={instance.id} className="relative">
              {instances.length > 1 && (
                <button
                  onClick={() => removeInstance(instance.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 z-10"
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
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">⚡ 성능 테스트 특징</h3>
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
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🧪 스트레스 테스트 방법</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. <strong>기본 테스트</strong>: 2개 인스턴스로 기본 성능 측정</li>
            <li>2. <strong>스트레스 테스트</strong>: 인스턴스를 5-10개까지 추가</li>
            <li>3. <strong>대용량 핸들러</strong>: 각 인스턴스에서 "일괄 추가" 버튼으로 100개 핸들러 추가</li>
            <li>4. <strong>동시 실행</strong>: 모든 인스턴스에서 동시에 "성능 테스트" 실행</li>
            <li>5. <strong>모니터링</strong>: 브라우저 개발자 도구로 메모리/CPU 사용량 확인</li>
            <li>6. <strong>한계 테스트</strong>: 브라우저가 버틸 수 있는 최대 인스턴스 수 찾기</li>
          </ol>
        </div>

        {/* 성능 분석 팁 */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">💡 성능 분석 팁</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>메모리 사용량</strong>: 인스턴스 수 × 핸들러 수에 비례</li>
            <li>• <strong>CPU 사용량</strong>: 동시 실행 시 멀티코어 활용도 확인</li>
            <li>• <strong>색상 변화</strong>: 실행 횟수에 따른 우선순위별 색상 농도 관찰</li>
            <li>• <strong>점프 패턴</strong>: 15→95 무한루프로 인한 색상 변화 확인</li>
            <li>• <strong>원본 비교</strong>: 위의 "원본 Priority Test 페이지"와 성능 차이 비교</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PriorityPerformancePage;