import React from 'react';

/**
 * Shared Component - Performance Impact Summary
 * 성능 영향 요약을 표시하는 순수 UI 컴포넌트
 */
export function PerformanceImpactSummary() {
  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="font-bold text-blue-700 mb-2">📊 스마트 메모이제이션 vs 비효율적 패턴</h3>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-green-700">✅ 스마트 메모이제이션의 장점</h4>
            <ul className="text-gray-600 space-y-1 ml-4">
              <li>🎯 <strong>함수 재사용:</strong> 핸들러 함수는 한 번만 생성</li>
              <li>🔄 <strong>지연 평가:</strong> 데이터는 실행 시점에 최신값 획득</li>
              <li>💰 <strong>계산 최적화:</strong> 복잡한 로직도 메모이제이션</li>
              <li>📈 <strong>낮은 렌더링:</strong> 불필요한 재등록 방지</li>
              <li>🧹 <strong>메모리 효율:</strong> 가비지 컬렉션 부하 감소</li>
            </ul>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-red-700">❌ 비효율적 패턴의 문제점</h4>
            <ul className="text-gray-600 space-y-1 ml-4">
              <li>💥 <strong>함수 재생성:</strong> 렌더링마다 모든 함수 새로 생성</li>
              <li>💸 <strong>계산 중복:</strong> 복잡한 로직도 매번 재정의</li>
              <li>📊 <strong>메모리 누수:</strong> 데이터 계속 누적 + 순환참조</li>
              <li>🔥 <strong>높은 렌더링:</strong> 핸들러 재등록으로 성능 저하</li>
              <li>🗑️ <strong>GC 부하:</strong> 대량 객체 생성으로 버벅임</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
        <div className="text-sm text-yellow-800">
          <strong>🧪 실험해보기:</strong>
          <div className="mt-2 grid md:grid-cols-2 gap-2">
            <div>
              <strong>1단계:</strong> 기본 버튼들로 차이 체험<br/>
              <strong>2단계:</strong> Heavy 버튼으로 성능 차이 확인<br/>
              <strong>3단계:</strong> Memory 버튼으로 누수 현상 관찰
            </div>
            <div>
              <strong>고급:</strong> Auto Update로 지속적 테스트<br/>
              <strong>관찰:</strong> 🔥 LEAK!, 🚨 BLOCKED! 상태 변화<br/>
              <strong>콘솔:</strong> 실행 로그에서 함수 생성 패턴 확인
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}