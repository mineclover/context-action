import React, { useState } from 'react';
import { createStore } from '@context-action/react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { DemoCard, Button } from '../../components/ui';

// 테스트용 객체 타입
interface User {
  id: string;
  name: string;
  profile: {
    age: number;
    address: {
      city: string;
      country: string;
    };
    hobbies: string[];
  };
}

// 초기 사용자 데이터
const initialUser: User = {
  id: '1',
  name: 'John Doe',
  profile: {
    age: 30,
    address: {
      city: 'Seoul',
      country: 'Korea'
    },
    hobbies: ['reading', 'coding']
  }
};

// 테스트용 Store 생성
const userStore = createStore<User>('immutability-test-user', initialUser);

function StoreImmutabilityTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentStoreValue, setCurrentStoreValue] = useState<User | null>(null);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const updateCurrentValue = () => {
    setCurrentStoreValue(userStore.getValue());
  };

  // 테스트 1: getValue로 받은 객체를 직접 수정해도 Store가 보호되는지 테스트
  const testDirectModification = () => {
    addResult('🧪 테스트 1: getValue 객체 직접 수정');
    
    // Store에서 현재 값 가져오기
    const userFromStore = userStore.getValue();
    const originalName = userStore.getValue().name; // 원본 이름 저장
    addResult(`원본 이름: ${originalName}`);
    
    try {
      // 반환된 객체를 직접 수정 시도
      userFromStore.name = 'Modified Name';
      userFromStore.profile.age = 999;
      userFromStore.profile.address.city = 'Modified City';
      userFromStore.profile.hobbies.push('hacking');
      
      addResult(`수정 시도 후 반환된 객체 이름: ${userFromStore.name}`);
      addResult(`수정 시도 후 Store 실제 이름: ${userStore.getValue().name}`);
      
      // 수정 후 Store 값이 원본과 동일한지 확인 (보호되었는지)
      if (userStore.getValue().name === originalName) {
        addResult('✅ 성공: Store 원본이 보호되었습니다!');
      } else {
        addResult('❌ 실패: Store 원본이 수정되었습니다!');
      }
    } catch (error) {
      addResult(`에러 발생: ${error}`);
    }
    
    updateCurrentValue();
  };

  // 테스트 2: setValue로 넣은 객체를 나중에 수정해도 Store가 보호되는지 테스트  
  const testSetValueProtection = () => {
    addResult('🧪 테스트 2: setValue 후 원본 객체 수정');
    
    // 새로운 객체 생성
    const newUser: User = {
      id: '2',
      name: 'Jane Smith',
      profile: {
        age: 25,
        address: {
          city: 'Busan',
          country: 'Korea'
        },
        hobbies: ['painting', 'music']
      }
    };
    
    // Store에 설정
    userStore.setValue(newUser);
    addResult(`Store에 설정된 이름: ${userStore.getValue().name}`);
    
    try {
      // 원본 객체를 수정
      newUser.name = 'Modified Jane';
      newUser.profile.age = 888;
      newUser.profile.address.city = 'Modified Busan';
      newUser.profile.hobbies.push('destructive-editing');
      
      addResult(`원본 객체 수정 후 이름: ${newUser.name}`);
      addResult(`Store의 실제 이름: ${userStore.getValue().name}`);
      
      if (userStore.getValue().name === 'Jane Smith') {
        addResult('✅ 성공: Store가 외부 수정으로부터 보호되었습니다!');
      } else {
        addResult('❌ 실패: Store가 외부 수정에 영향받았습니다!');
      }
    } catch (error) {
      addResult(`에러 발생: ${error}`);
    }
    
    updateCurrentValue();
  };

  // 테스트 3: update 함수에서 받은 객체를 수정해도 안전한지 테스트
  const testUpdateProtection = () => {
    addResult('🧪 테스트 3: update 함수 내 객체 수정');
    
    try {
      userStore.update((currentUser) => {
        addResult(`Update 함수 내 현재 이름: ${currentUser.name}`);
        
        // update 함수에서 받은 객체를 직접 수정 시도
        currentUser.name = 'Hacked Name';
        currentUser.profile.age = 777;
        currentUser.profile.address.city = 'Hacked City';
        
        addResult(`수정 시도 후 currentUser 이름: ${currentUser.name}`);
        
        // 정상적인 업데이트 반환
        return {
          ...currentUser,
          name: 'Updated Name',
          profile: {
            ...currentUser.profile,
            age: 26
          }
        };
      });
      
      const finalValue = userStore.getValue();
      addResult(`최종 Store 이름: ${finalValue.name}, 나이: ${finalValue.profile.age}`);
      
      if (finalValue.name === 'Updated Name' && finalValue.profile.age === 26) {
        addResult('✅ 성공: update 함수가 안전하게 작동했습니다!');
      } else {
        addResult('❌ 실패: update 함수에서 예상치 못한 결과가 발생했습니다!');
      }
    } catch (error) {
      addResult(`에러 발생: ${error}`);
    }
    
    updateCurrentValue();
  };

  // 테스트 4: 중첩 객체와 배열의 깊은 복사 테스트
  const testDeepObjectProtection = () => {
    addResult('🧪 테스트 4: 중첩 객체와 배열 깊은 복사');
    
    const complexUser: User = {
      id: '3',
      name: 'Complex User',
      profile: {
        age: 35,
        address: {
          city: 'Tokyo',
          country: 'Japan'
        },
        hobbies: ['swimming', 'traveling', 'photography']
      }
    };
    
    userStore.setValue(complexUser);
    
    try {
      const retrievedUser = userStore.getValue();
      
      // 중첩 객체 수정 시도
      retrievedUser.profile.address.city = 'Modified Tokyo';
      retrievedUser.profile.address.country = 'Modified Japan';
      
      // 배열 수정 시도  
      retrievedUser.profile.hobbies.push('hacking');
      retrievedUser.profile.hobbies[0] = 'modified-swimming';
      
      const storeValue = userStore.getValue();
      
      addResult(`수정 시도 후 Store 도시: ${storeValue.profile.address.city}`);
      addResult(`수정 시도 후 Store 국가: ${storeValue.profile.address.country}`);
      addResult(`수정 시도 후 Store 취미: ${JSON.stringify(storeValue.profile.hobbies)}`);
      
      const isAddressProtected = storeValue.profile.address.city === 'Tokyo' && 
                                storeValue.profile.address.country === 'Japan';
      const isHobbiesProtected = storeValue.profile.hobbies.length === 3 &&
                                storeValue.profile.hobbies[0] === 'swimming' &&
                                !storeValue.profile.hobbies.includes('hacking');
      
      if (isAddressProtected && isHobbiesProtected) {
        addResult('✅ 성공: 중첩 객체와 배열이 완벽하게 보호되었습니다!');
      } else {
        addResult('❌ 실패: 중첩 객체나 배열이 수정되었습니다!');
      }
    } catch (error) {
      addResult(`에러 발생: ${error}`);
    }
    
    updateCurrentValue();
  };

  const runAllTests = () => {
    setTestResults([]);
    addResult('🚀 Store 불변성 테스트 시작');
    
    // 순차적으로 테스트 실행
    setTimeout(() => testDirectModification(), 100);
    setTimeout(() => testSetValueProtection(), 500);
    setTimeout(() => testUpdateProtection(), 900);
    setTimeout(() => testDeepObjectProtection(), 1300);
    setTimeout(() => addResult('🏁 모든 테스트 완료'), 1700);
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentStoreValue(null);
  };

  return (
    <PageWithLogMonitor pageId="store-immutability-test">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Store 불변성(Immutability) 테스트
          </h1>
          <p className="text-gray-600">
            Store에 객체를 넣고 수정했을 때 원본이 보호되는지 테스트합니다.
          </p>
        </div>

        {/* 컨트롤 패널 */}
        <DemoCard title="테스트 컨트롤" variant="info">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={runAllTests} variant="primary">
              🧪 모든 테스트 실행
            </Button>
            <Button onClick={testDirectModification} variant="outline">
              테스트 1: 직접 수정
            </Button>
            <Button onClick={testSetValueProtection} variant="outline">
              테스트 2: setValue 보호
            </Button>
            <Button onClick={testUpdateProtection} variant="outline">
              테스트 3: update 보호
            </Button>
            <Button onClick={testDeepObjectProtection} variant="outline">
              테스트 4: 깊은 복사
            </Button>
            <Button onClick={clearResults} variant="outline">
              🗑️ 결과 지우기
            </Button>
          </div>
        </DemoCard>

        {/* 현재 Store 값 */}
        {currentStoreValue && (
          <DemoCard title="현재 Store 값" variant="logger">
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(currentStoreValue, null, 2)}
            </pre>
          </DemoCard>
        )}

        {/* 테스트 결과 */}
        {testResults.length > 0 && (
          <DemoCard title="테스트 결과" variant="monitor">
            <div className="space-y-1 max-h-96 overflow-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`text-sm p-2 rounded font-mono ${
                    result.includes('✅') ? 'bg-green-100 text-green-800' :
                    result.includes('❌') ? 'bg-red-100 text-red-800' :
                    result.includes('🧪') ? 'bg-blue-100 text-blue-800 font-semibold' :
                    result.includes('🚀') || result.includes('🏁') ? 'bg-purple-100 text-purple-800 font-semibold' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </DemoCard>
        )}

        {/* 테스트 설명 */}
        <DemoCard title="테스트 항목 설명" variant="default">
          <div className="space-y-3 text-sm">
            <div>
              <strong>테스트 1: 직접 수정</strong>
              <p className="text-gray-600">store.getValue()로 받은 객체를 직접 수정해도 Store 내부가 보호되는지 확인</p>
            </div>
            <div>
              <strong>테스트 2: setValue 보호</strong>
              <p className="text-gray-600">store.setValue(obj) 후에 원본 obj를 수정해도 Store가 영향받지 않는지 확인</p>
            </div>
            <div>
              <strong>테스트 3: update 보호</strong>
              <p className="text-gray-600">store.update() 함수 내에서 받은 객체를 수정해도 안전한지 확인</p>
            </div>
            <div>
              <strong>테스트 4: 깊은 복사</strong>
              <p className="text-gray-600">중첩된 객체와 배열까지 완전히 복사되어 보호되는지 확인</p>
            </div>
          </div>
        </DemoCard>
      </div>
    </PageWithLogMonitor>
  );
}

export default StoreImmutabilityTestPage;