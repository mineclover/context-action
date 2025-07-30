import { Outlet } from 'react-router-dom';

export function ReactIndexPage() {
  return (<>
    <div>
      <h1>React Integration</h1>
      <p>
        Context Action 라이브러리의 React 통합 기능을 탐색해보세요. 
        타입 안전한 액션 파이프라인 관리와 React 컴포넌트를 완벽하게 통합합니다.
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
          <h3>🚀 Basics</h3>
          <p>
            React 통합의 기본 사용법을 배워보세요. createActionContext를 사용한 
            컨텍스트 생성과 useAction, useActionHandler 훅 활용법을 다룹니다.
          </p>
          <a href="/react/basics" style={{ 
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
          <h3>🎣 Hooks</h3>
          <p>
            커스텀 훅과 고급 상태 관리 패턴을 익혀보세요. 액션 핸들러의 조건부 등록, 
            메모이제이션 최적화, 동적 핸들러 관리 등을 다룹니다.
          </p>
          <a href="/react/hooks" style={{ 
            display: 'inline-block', 
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}>
            Hooks 알아보기 →
          </a>
        </div>

        <div style={{ 
          padding: '20px', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>🔄 Context</h3>
          <p>
            복잡한 컨텍스트 시나리오를 마스터하세요. 중첩 컨텍스트, 전역/지역 상태 분리, 
            다중 컨텍스트 통신, 컨텍스트 경계 처리 등을 학습합니다.
          </p>
          <a href="/react/context" style={{ 
            display: 'inline-block', 
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}>
            Context 탐구하기 →
          </a>
        </div>

        <div style={{ 
          padding: '20px', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>📝 Forms</h3>
          <p>
            복잡한 폼 처리를 위한 액션 기반 패턴을 배워보세요. 실시간 유효성 검사, 
            동적 필드 관리, 폼 상태 추적 등의 고급 기능을 다룹니다.
          </p>
          <a href="/react/forms" style={{ 
            display: 'inline-block', 
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#fd7e14',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}>
            Forms 마스터하기 →
          </a>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>💡 Quick Start</h3>
        <pre style={{ overflow: 'auto', fontSize: '14px' }}>
{`// 1. 액션 타입 정의
interface MyActions extends ActionPayloadMap {
  increment: undefined;
  setCount: number;
  reset: undefined;
}

// 2. 컨텍스트 생성
const { Provider, useAction, useActionHandler } = 
  createActionContext<MyActions>();

// 3. 컴포넌트에서 사용
function Counter() {
  const [count, setCount] = useState(0);
  const dispatch = useAction();

  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('setCount', (value) => setCount(value));
  useActionHandler('reset', () => setCount(0));

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch('increment')}>+1</button>
      <button onClick={() => dispatch('setCount', 42)}>Set 42</button>
      <button onClick={() => dispatch('reset')}>Reset</button>
    </div>
  );
}

// 4. Provider로 감싸기
<Provider>
  <Counter />
</Provider>`}
        </pre>
      </div>
    </div>
    <Outlet />
  </>);
}