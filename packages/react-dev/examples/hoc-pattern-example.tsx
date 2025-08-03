/**
 * HOC Pattern Example for Context Store Pattern
 * 
 * 이 예제는 Context Store Pattern의 HOC 기능을 보여줍니다.
 * withProvider와 withCustomProvider 사용법을 데모합니다.
 */

import React from 'react';
import { 
  createContextStorePattern, 
  useStoreValue, 
  ActionProvider,
  useActionDispatch,
  ActionPayloadMap 
} from '@context-action/react';

// 액션 타입 정의
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string };
  resetProfile: void;
}

// Context Store 패턴 생성
const UserStores = createContextStorePattern('UserExample');

// 1. 기본 HOC 패턴 - withProvider
const withUserStores = UserStores.withProvider('user-profile-demo');

const BasicUserProfile = withUserStores(() => {
  const userStore = UserStores.useStore('user', { 
    name: 'John Doe', 
    email: 'john@example.com' 
  });
  const user = useStoreValue(userStore);
  
  const updateName = () => {
    userStore.setValue({ 
      ...user, 
      name: `Updated User ${Date.now()}` 
    });
  };
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', margin: '8px' }}>
      <h3>Basic User Profile (HOC Pattern)</h3>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <button onClick={updateName}>Update Name</button>
    </div>
  );
});

// 2. 커스텀 HOC 패턴 - withCustomProvider (ActionProvider 포함)
const withUserStoresAndActions = UserStores.withCustomProvider(
  ({ children }) => (
    <ActionProvider config={{ logLevel: 'DEBUG' }}>
      {children}
    </ActionProvider>
  ),
  'user-with-actions-demo'
);

const AdvancedUserProfile = withUserStoresAndActions(() => {
  const dispatch = useActionDispatch<UserActions>();
  const userStore = UserStores.useStore('user', { 
    name: 'Jane Smith', 
    email: 'jane@example.com' 
  });
  const user = useStoreValue(userStore);
  
  // Action handler는 실제로는 useEffect에서 등록해야 하지만
  // 이 예제에서는 단순화하여 직접 store 업데이트
  const handleUpdateProfile = () => {
    const newProfile = {
      name: `Action Updated ${Date.now()}`,
      email: `updated${Date.now()}@example.com`
    };
    userStore.setValue(newProfile);
    
    // 실제로는 dispatch를 통해 처리
    // dispatch('updateProfile', newProfile);
  };
  
  const handleReset = () => {
    userStore.setValue({ name: 'Jane Smith', email: 'jane@example.com' });
    // dispatch('resetProfile');
  };
  
  return (
    <div style={{ border: '1px solid #007acc', padding: '16px', margin: '8px' }}>
      <h3>Advanced User Profile (HOC + ActionProvider)</h3>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <div>
        <button onClick={handleUpdateProfile} style={{ marginRight: '8px' }}>
          Update via Action
        </button>
        <button onClick={handleReset}>
          Reset Profile
        </button>
      </div>
    </div>
  );
});

// 3. 격리된 컴포넌트 - 각각 다른 Store 인스턴스 사용
const IsolatedUserCard = withUserStores(() => {
  const userStore = UserStores.useIsolatedStore('isolated-user', { 
    name: 'Isolated User', 
    email: 'isolated@example.com' 
  });
  const user = useStoreValue(userStore);
  
  const randomUpdate = () => {
    userStore.setValue({
      name: `Random User ${Math.floor(Math.random() * 1000)}`,
      email: `random${Math.floor(Math.random() * 1000)}@example.com`
    });
  };
  
  return (
    <div style={{ border: '1px solid #28a745', padding: '16px', margin: '8px' }}>
      <h4>Isolated User Card</h4>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <button onClick={randomUpdate}>Random Update</button>
    </div>
  );
});

// 메인 데모 컴포넌트
export function HOCPatternDemo() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Context Store Pattern HOC Demo</h1>
      <p>
        이 데모는 Context Store Pattern의 HOC 기능을 보여줍니다. 
        각 컴포넌트는 자동으로 Provider로 감싸져서 독립적인 Store 영역을 가집니다.
      </p>
      
      <h2>1. Basic HOC Pattern</h2>
      <p>withProvider()를 사용하여 Context Store Provider만 자동 래핑</p>
      <BasicUserProfile />
      
      <h2>2. Custom HOC Pattern</h2>
      <p>withCustomProvider()를 사용하여 ActionProvider까지 함께 래핑</p>
      <AdvancedUserProfile />
      
      <h2>3. Isolated Components</h2>
      <p>같은 HOC를 사용하지만 각각 독립적인 Store 인스턴스</p>
      <IsolatedUserCard />
      <IsolatedUserCard />
      <IsolatedUserCard />
      
      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f8f9fa' }}>
        <h3>HOC Pattern 장점</h3>
        <ul>
          <li>✅ <strong>자동 Provider 래핑</strong>: 수동으로 Provider 감쌀 필요 없음</li>
          <li>✅ <strong>완전한 격리</strong>: 각 컴포넌트마다 독립적인 Store 영역</li>
          <li>✅ <strong>재사용성</strong>: HOC를 여러 컴포넌트에 적용 가능</li>
          <li>✅ <strong>조합 가능</strong>: 다른 Provider와 쉽게 조합</li>
          <li>✅ <strong>타입 안전성</strong>: 완전한 TypeScript 지원</li>
        </ul>
      </div>
    </div>
  );
}

export default HOCPatternDemo;