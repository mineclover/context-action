import { Outlet, useLocation } from 'react-router-dom';

export function JotaiIndexPage() {
  const location = useLocation();
  const isIndex = location.pathname === '/jotai';

  return (
    <>
      {isIndex && <div>
        <h1>Jotai Integration</h1>
        <p>
          Context Action과 Jotai의 강력한 통합을 탐색해보세요. 아톰 기반 상태
          관리와 액션 파이프라인을 완벽하게 결합한 혁신적인 상태 관리
          솔루션입니다.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginTop: '30px',
          }}
        >
          <div
            style={{
              padding: '20px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              backgroundColor: '#fff3cd',
            }}
          >
            <h3>🚧 Basics</h3>
            <p>
              Jotai 아톰과 Context Action의 기본적인 통합을 배워보세요.
              createAtomContext를 사용한 아톰 기반 상태 관리 패턴을 다룹니다.
            </p>
            <a
              href="/jotai/basics"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                textDecoration: 'none',
                borderRadius: '4px',
              }}
            >
              Basics 살펴보기 →
            </a>
            <div
              style={{
                marginTop: '10px',
                fontSize: '12px',
                color: '#856404',
              }}
            >
              🚧 개발 중
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              backgroundColor: '#fff3cd',
            }}
          >
            <h3>🚧 Async</h3>
            <p>
              비동기 작업과 상태 관리를 마스터하세요. async 아톰, 서버 상태,
              캐싱 등을 Context Action과 함께 활용하는 방법을 학습합니다.
            </p>
            <a
              href="/jotai/async"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                textDecoration: 'none',
                borderRadius: '4px',
              }}
            >
              Async 탐구하기 →
            </a>
            <div
              style={{
                marginTop: '10px',
                fontSize: '12px',
                color: '#856404',
              }}
            >
              🚧 개발 중
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              backgroundColor: '#fff3cd',
            }}
          >
            <h3>🚧 Persistence</h3>
            <p>
              상태 지속성과 저장 기능을 배워보세요. localStorage,
              sessionStorage, 커스텀 스토리지 등을 활용한 지속적인 상태 관리를
              다룹니다.
            </p>
            <a
              href="/jotai/persistence"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                textDecoration: 'none',
                borderRadius: '4px',
              }}
            >
              Persistence 알아보기 →
            </a>
            <div
              style={{
                marginTop: '10px',
                fontSize: '12px',
                color: '#856404',
              }}
            >
              🚧 개발 중
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#d1ecf1',
            borderRadius: '8px',
            border: '1px solid #bee5eb',
          }}
        >
          <h3>🎯 Jotai + Context Action = 💪</h3>
          <p>
            두 라이브러리의 장점을 결합하여 더욱 강력한 상태 관리 솔루션을
            제공합니다:
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginTop: '20px',
            }}
          >
            <div>
              <h4>🔥 Jotai의 장점</h4>
              <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <li>Bottom-up 아톰 기반 상태</li>
                <li>자동 의존성 추적</li>
                <li>최적화된 리렌더링</li>
                <li>TypeScript 완벽 지원</li>
              </ul>
            </div>
            <div>
              <h4>⚡ Context Action의 장점</h4>
              <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <li>타입 안전한 액션 파이프라인</li>
                <li>우선순위 기반 실행</li>
                <li>미들웨어 시스템</li>
                <li>비동기 액션 지원</li>
              </ul>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <h3>📋 권장 사용 패턴</h3>
          <pre style={{ overflow: 'auto', fontSize: '14px' }}>
            {`import { createAtomContext } from '@context-action/jotai';

// 간편하게 카운터 컨텍스트 생성
export const {
  Provider: CounterProvider,
  useAtomState: useCounter,
  useAtomReadOnly: useCounterValue,
  useAtomSetter: useCounterSetter,
  useAtomSelect: useCounterSelect,
} = createAtomContext(0);

// 컴포넌트에서 사용
function Counter() {
  const [count, setCount] = useCounter();
  const doubleCount = useCounterSelect(count => count * 2);
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={() => setCount(prev => prev + 1)}>+1</button>
    </div>
  );
}

// Provider로 감싸기
<CounterProvider>
  <Counter />
</CounterProvider>`}
          </pre>
        </div>

        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffeaa7',
          }}
        >
          <h3>🚧 개발 현황</h3>
          <p>
            Jotai 통합은 현재 개발 중입니다. createAtomContext 패턴이 구현되어
            있으며, 다음 기능들이 순차적으로 추가될 예정입니다:
          </p>
          <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <li>✅ createAtomContext 기본 구현</li>
            <li>🔄 액션과 아톰 연동 패턴</li>
            <li>🔄 비동기 아톰 통합</li>
            <li>🔄 영속성 어댑터</li>
            <li>🔄 DevTools 통합</li>
          </ul>

          <p
            style={{ marginTop: '15px', fontSize: '14px', fontStyle: 'italic' }}
          >
            💡 현재는 기본적인 createAtomContext 패턴을 확인하실 수 있습니다. 각
            페이지에서 권장 사용 패턴과 예시 코드를 참고해보세요.
          </p>
        </div>
      </div>}
      <Outlet />
    </>
  );
}
