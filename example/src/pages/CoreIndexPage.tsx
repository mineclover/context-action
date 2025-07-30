import { Outlet } from 'react-router-dom';

export function CoreIndexPage() {
  return (<>
    <div>
      <h1>Core Library</h1>
      <p>
        Context Action의 핵심 라이브러리를 탐색해보세요. 
        순수 JavaScript/TypeScript 환경에서 사용할 수 있는 타입 안전한 액션 파이프라인 관리 시스템입니다.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px', 
        marginTop: '30px' 
      }}>
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>📚 Basics</h3>
          <p>
            Core 라이브러리의 기본적인 ActionRegister 사용법을 배워보세요. 
            순수 JavaScript/TypeScript 환경에서 액션 파이프라인을 구축하는 방법을 다룹니다.
          </p>
          <a href="/core/basics" style={{ 
            display: 'inline-block', 
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}>
            Basics 시작하기 →
          </a>
        </div>

        <div style={{ 
          padding: '20px', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>🚀 Advanced</h3>
          <p>
            고급 기능들을 마스터하세요. 미들웨어 시스템, 우선순위 기반 실행, 액션 체이닝, 
            조건부 실행, 에러 핸들링 등의 복잡한 패턴을 학습합니다.
          </p>
          <a href="/core/advanced" style={{ 
            display: 'inline-block', 
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}>
            Advanced 탐구하기 →
          </a>
        </div>

        <div style={{ 
          padding: '20px', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>⚡ Performance</h3>
          <p>
            성능 최적화와 벤치마킹을 배워보세요. 대량 액션 처리, 메모리 효율성, 실행 속도 측정, 
            구독/해제 성능 등을 실시간으로 모니터링하고 비교할 수 있습니다.
          </p>
          <a href="/core/performance" style={{ 
            display: 'inline-block', 
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}>
            Performance 최적화하기 →
          </a>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '30px', 
        marginTop: '40px' 
      }}>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>🎯 주요 특징</h3>
          <ul style={{ lineHeight: '1.6' }}>
            <li><strong>타입 안전성</strong>: TypeScript 완벽 지원으로 컴파일 타임 오류 방지</li>
            <li><strong>우선순위 시스템</strong>: 핸들러 실행 순서를 세밀하게 제어</li>
            <li><strong>비동기 지원</strong>: Promise 기반 액션과 에러 핸들링</li>
            <li><strong>파이프라인 제어</strong>: next(), abort(), modifyPayload() 메서드</li>
            <li><strong>메모리 효율성</strong>: 자동 정리와 최적화된 구독 관리</li>
          </ul>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>💻 Quick Start</h3>
          <pre style={{ overflow: 'auto', fontSize: '12px' }}>
{`import { ActionRegister } from '@context-action/core';

// 1. 액션 타입 정의
interface AppActions extends ActionPayloadMap {
  increment: undefined;
  setCount: number;
  reset: undefined;
}

// 2. ActionRegister 생성
const actionRegister = new ActionRegister<AppActions>();

// 3. 핸들러 등록
actionRegister.register('increment', (_, controller) => {
  count++;
  controller.next();
}, { priority: 1 });

// 4. 액션 디스패치
await actionRegister.dispatch('increment');
await actionRegister.dispatch('setCount', 42);`}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
        <h3>🔥 성능 벤치마크</h3>
        <p>
          Core 라이브러리는 높은 성능을 자랑합니다. Performance 섹션에서 실제 벤치마크 테스트를 실행해보고 
          다양한 시나리오에서의 성능을 확인해보세요:
        </p>
        <ul>
          <li>단일 액션: <strong>&lt;0.1ms</strong> 평균 실행 시간</li>
          <li>배치 처리: <strong>1000개 액션</strong>을 1초 이내 처리</li>
          <li>메모리 사용량: <strong>최적화된</strong> 가비지 컬렉션</li>
          <li>동시 실행: <strong>10,000개 동시</strong> 액션 지원</li>
        </ul>
      </div>
    </div>
    <Outlet />
  </>);
}