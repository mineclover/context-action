import { CodeBlock, CodeExample } from '@/components/ui';

// MVVM 패턴에 따른 View 컴포넌트 - 코드 예제만 담당
export function AdvancedCodeExamples() {
  return (
    <div className="grid gap-6">
      {/* 기본 ActionRegister 사용법 */}
      <CodeExample title="기본 ActionRegister 사용법">
        <CodeBlock>{`import { ActionRegister, ActionPayloadMap } from '@context-action/core';

// 액션 맵 타입 정의
interface MyActionMap extends ActionPayloadMap {
  increment: undefined;
  updateUser: { id: string; name: string };
}

// ActionRegister 인스턴스 생성
const actionRegister = new ActionRegister<MyActionMap>();

// 핸들러 등록
const unsubscribe = actionRegister.register(
  'increment',
  (payload, controller) => {
    console.log('Increment action executed');
    // 비즈니스 로직 실행
  },
  { priority: 1 } // 우선순위 설정
);

// 액션 실행
actionRegister.dispatch('increment');

// 핸들러 해제
unsubscribe();`}</CodeBlock>
      </CodeExample>

      {/* 우선순위 시스템 */}
      <CodeExample title="우선순위 시스템">
        <CodeBlock>{`// 높은 우선순위 핸들러 (먼저 실행)
actionRegister.register('myAction', handler1, { priority: 3 });

// 중간 우선순위 핸들러 (두 번째 실행)  
actionRegister.register('myAction', handler2, { priority: 2 });

// 낮은 우선순위 핸들러 (마지막 실행)
actionRegister.register('myAction', handler3, { priority: 1 });

// 실행 순서: handler1 → handler2 → handler3
actionRegister.dispatch('myAction', payload);`}</CodeBlock>
      </CodeExample>

      {/* 비동기 핸들러 */}
      <CodeExample title="비동기 핸들러">
        <CodeBlock>{`// 비동기 핸들러 등록
actionRegister.register(
  'fetchData',
  async (payload, controller) => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      
      // 성공 처리
      console.log('Data fetched:', data);
    } catch (error) {
      // 에러 처리
      console.error('Fetch failed:', error);
      controller.abort('Failed to fetch data');
    }
  },
  { priority: 1 }
);

// 비동기 액션 실행
actionRegister.dispatch('fetchData', { url: '/api/users' });`}</CodeBlock>
      </CodeExample>

      {/* 에러 처리 및 Abort */}
      <CodeExample title="에러 처리 및 Abort">
        <CodeBlock>{`actionRegister.register(
  'validateAndSave',
  (data, controller) => {
    // 데이터 검증
    if (!data.email) {
      controller.abort('Email is required');
      return;
    }
    
    if (!data.email.includes('@')) {
      controller.abort('Invalid email format');
      return;
    }
    
    // 검증 통과 시 저장
    saveUserData(data);
  },
  { priority: 1 }
);

// 잘못된 데이터로 테스트
actionRegister.dispatch('validateAndSave', { name: 'John' }); 
// 결과: "Email is required" 메시지와 함께 중단`}</CodeBlock>
      </CodeExample>

      {/* 복합 핸들러 패턴 */}
      <CodeExample title="복합 핸들러 패턴">
        <CodeBlock>{`interface UserActionMap extends ActionPayloadMap {
  saveUser: { user: { id: string; name: string; email: string } };
}

const userActionRegister = new ActionRegister<UserActionMap>();

// 1단계: 유효성 검사 핸들러 (우선순위 3)
userActionRegister.register(
  'saveUser',
  ({ user }, controller) => {
    if (!user.email || !user.name) {
      controller.abort('필수 필드가 누락되었습니다');
      return;
    }
    console.log('✅ 유효성 검사 통과');
  },
  { priority: 3 }
);

// 2단계: 비즈니스 로직 핸들러 (우선순위 2)
userActionRegister.register(
  'saveUser',
  async ({ user }, controller) => {
    try {
      await saveToDatabase(user);
      console.log('✅ 데이터베이스 저장 완료');
    } catch (error) {
      controller.abort('데이터베이스 저장 실패');
    }
  },
  { priority: 2 }
);

// 3단계: 후처리 핸들러 (우선순위 1)
userActionRegister.register(
  'saveUser',
  ({ user }, controller) => {
    // 캐시 업데이트, 알림 전송 등
    updateUserCache(user);
    showSuccessNotification(\`\${user.name} 저장 완료\`);
    console.log('✅ 후처리 완료');
  },
  { priority: 1 }
);`}</CodeBlock>
      </CodeExample>

      {/* 조건부 실행 패턴 */}
      <CodeExample title="조건부 실행 패턴">
        <CodeBlock>{`interface ConditionalActionMap extends ActionPayloadMap {
  processOrder: { 
    orderId: string; 
    amount: number; 
    userType: 'premium' | 'basic' 
  };
}

const orderRegister = new ActionRegister<ConditionalActionMap>();

// 프리미엄 사용자 전용 핸들러
orderRegister.register(
  'processOrder',
  ({ amount, userType }, controller) => {
    if (userType !== 'premium') {
      return; // 조건 불만족 시 조용히 스킵
    }
    
    // 프리미엄 할인 적용
    const discountedAmount = amount * 0.9;
    console.log(\`프리미엄 할인 적용: \${discountedAmount}\`);
  },
  { priority: 3 }
);

// 일반 주문 처리 핸들러
orderRegister.register(
  'processOrder',
  async ({ orderId, amount }, controller) => {
    try {
      await processPayment(orderId, amount);
      console.log(\`주문 \${orderId} 처리 완료\`);
    } catch (error) {
      controller.abort('결제 처리 실패');
    }
  },
  { priority: 2 }
);`}</CodeBlock>
      </CodeExample>

      {/* 결과 수집 패턴 */}
      <CodeExample title="결과 수집 패턴">
        <CodeBlock>{`interface ResultActionMap extends ActionPayloadMap {
  calculateScore: { 
    userId: string; 
    answers: number[] 
  };
}

const scoreRegister = new ActionRegister<ResultActionMap>();

// 결과를 저장할 배열 (외부 상태)
let calculationResults: number[] = [];

// 기본 점수 계산
scoreRegister.register(
  'calculateScore',
  ({ answers }, controller) => {
    const baseScore = answers.reduce((sum, answer) => sum + answer, 0);
    calculationResults.push(baseScore);
    console.log(\`기본 점수: \${baseScore}\`);
  },
  { priority: 3 }
);

// 보너스 점수 계산
scoreRegister.register(
  'calculateScore',
  ({ answers }, controller) => {
    const bonusScore = answers.filter(answer => answer > 8).length * 10;
    calculationResults.push(bonusScore);
    console.log(\`보너스 점수: \${bonusScore}\`);
  },
  { priority: 2 }
);

// 최종 결과 처리
scoreRegister.register(
  'calculateScore',
  ({ userId }, controller) => {
    const finalScore = calculationResults.reduce((sum, score) => sum + score, 0);
    console.log(\`\${userId}의 최종 점수: \${finalScore}\`);
    
    // 결과 초기화
    calculationResults = [];
  },
  { priority: 1 }
);`}</CodeBlock>
      </CodeExample>

      {/* 실시간 처리 패턴 */}
      <CodeExample title="실시간 처리 패턴">
        <CodeBlock>{`interface RealtimeActionMap extends ActionPayloadMap {
  updatePosition: { x: number; y: number; timestamp: number };
}

const realtimeRegister = new ActionRegister<RealtimeActionMap>();

// 위치 검증 핸들러
realtimeRegister.register(
  'updatePosition',
  ({ x, y }, controller) => {
    if (x < 0 || y < 0 || x > 1920 || y > 1080) {
      controller.abort('유효하지 않은 좌표입니다');
      return;
    }
  },
  { priority: 3 }
);

// 스로틀링 핸들러 (성능 최적화)
let lastUpdateTime = 0;
const THROTTLE_MS = 16; // 60fps

realtimeRegister.register(
  'updatePosition',
  ({ timestamp }, controller) => {
    if (timestamp - lastUpdateTime < THROTTLE_MS) {
      controller.abort('업데이트가 너무 빈번합니다');
      return;
    }
    lastUpdateTime = timestamp;
  },
  { priority: 2 }
);

// 실제 위치 업데이트
realtimeRegister.register(
  'updatePosition',
  ({ x, y }, controller) => {
    // DOM 업데이트 또는 상태 변경
    updateElementPosition(x, y);
    console.log(\`위치 업데이트: (\${x}, \${y})\`);
  },
  { priority: 1 }
);`}</CodeBlock>
      </CodeExample>

      {/* React 통합 패턴 */}
      <CodeExample title="React 통합 패턴">
        <CodeBlock>{`import { ActionRegister } from '@context-action/core';
import { useEffect, useCallback } from 'react';

interface ComponentActionMap extends ActionPayloadMap {
  loadData: { id: string };
  updateStatus: { status: string };
}

function useAdvancedActionRegister() {
  const [actionRegister] = useState(
    () => new ActionRegister<ComponentActionMap>()
  );

  useEffect(() => {
    // 데이터 로딩 핸들러
    const unsubscribeLoad = actionRegister.register(
      'loadData',
      async ({ id }, controller) => {
        try {
          setLoading(true);
          const data = await fetchData(id);
          setData(data);
        } catch (error) {
          controller.abort('데이터 로딩 실패');
        } finally {
          setLoading(false);
        }
      },
      { priority: 1 }
    );

    // 상태 업데이트 핸들러
    const unsubscribeStatus = actionRegister.register(
      'updateStatus',
      ({ status }, controller) => {
        setStatus(status);
        // 상태 변경 로깅
        console.log(\`상태 변경: \${status}\`);
      },
      { priority: 1 }
    );

    return () => {
      unsubscribeLoad();
      unsubscribeStatus();
    };
  }, [actionRegister]);

  return actionRegister;
}

// 컴포넌트에서 사용
function MyComponent() {
  const actionRegister = useAdvancedActionRegister();
  
  const handleLoadData = useCallback((id: string) => {
    actionRegister.dispatch('loadData', { id });
  }, [actionRegister]);

  return (
    <button onClick={() => handleLoadData('123')}>
      데이터 로드
    </button>
  );
}`}</CodeBlock>
      </CodeExample>
    </div>
  );
}