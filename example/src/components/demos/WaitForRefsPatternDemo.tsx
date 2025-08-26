import React from 'react';
import { DemoRefsProvider } from '../../hooks/useDemoRef';
import { OnMountPatternDemo } from './ref-patterns/OnMountPatternDemo';
import { ConditionalPatternDemo } from './ref-patterns/ConditionalPatternDemo';
import { BlockingPatternDemo } from './ref-patterns/BlockingPatternDemo';
import { MemoizationPatternDemo } from './ref-patterns/MemoizationPatternDemo';

/**
 * RefContext 패턴 데모 모음
 * - onMount 패턴: 마운트 시 자동 실행
 * - executeIfMounted 패턴: 조건부 실행
 * - waitForRefs 패턴: 블로킹 vs Non-blocking 비교
 * - 메모이제이션 패턴: 지연 평가 테스트
 */
export function WaitForRefsPatternDemo() {
  return (
    <DemoRefsProvider>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">RefContext 패턴 데모</h1>
          <p className="text-gray-600">
            다양한 RefContext 사용 패턴과 올바른 구현 방법을 확인해보세요
          </p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <OnMountPatternDemo />
          <ConditionalPatternDemo />
        </div>
        
        <div className="grid gap-6">
          <BlockingPatternDemo />
          <MemoizationPatternDemo />
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🎯 패턴 사용 가이드</h3>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <h4 className="font-medium text-green-700">✅ 권장 패턴</h4>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• <strong>onMount</strong>: 마운트 시 자동 실행</li>
                <li>• <strong>executeIfMounted</strong>: 안전한 조건부 실행</li>
                <li>• <strong>async/await</strong>: waitForRefs 비동기 처리</li>
                <li>• <strong>빈 deps 배열</strong>: 메모이제이션 최적화</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-700">❌ 피해야 할 패턴</h4>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• <strong>busy waiting</strong>: while 루프로 대기</li>
                <li>• <strong>동기적 처리</strong>: Promise를 동기적으로 처리</li>
                <li>• <strong>불필요한 deps</strong>: ref 객체를 deps에 포함</li>
                <li>• <strong>직접 DOM 접근</strong>: target null 체크 없이</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DemoRefsProvider>
  );
}

// 기존 컴포넌트와의 호환성을 위한 별칭
export { WaitForRefsPatternDemo as WaitForRefsPerformanceDemo };
export default WaitForRefsPatternDemo;