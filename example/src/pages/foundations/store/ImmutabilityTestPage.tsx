import { createStore } from '@context-action/react';
import { useState } from 'react';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Button, DemoCard } from '@/components/ui';
import { produce } from 'immer';

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
      country: 'Korea',
    },
    hobbies: ['reading', 'coding'],
  },
};

// 테스트용 Store 생성
const userStore = createStore<User>('immutability-test-user', initialUser);

function StoreImmutabilityTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentStoreValue, setCurrentStoreValue] = useState<User | null>(null);

  const addResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
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
      (userFromStore as any).name = 'Modified Name';
      (userFromStore as any).profile.age = 999;
      (userFromStore as any).profile.address.city = 'Modified City';
      (userFromStore as any).profile.hobbies.push('hacking');

      addResult(`수정 시도 후 반환된 객체 이름: ${userFromStore.name}`);
      addResult(`수정 시도 후 Store 실제 이름: ${userStore.getValue().name}`);

      // 수정 후 Store 값이 원본과 동일한지 확인 (보호되었는지)
      if (userStore.getValue().name === originalName) {
        addResult('✅ 성공: Store 원본이 보호되었습니다!');
      } else {
        addResult('❌ 실패: Store 원본이 수정되었습니다!');
      }
    } catch (error) {
      addResult(`⚠️ Immer 보호 동작: ${error}`);
      addResult('ℹ️ 이는 Immer가 불변성을 강제로 보장하는 정상적인 동작입니다.');
      
      // Store 값이 여전히 원본과 같은지 확인
      if (userStore.getValue().name === originalName) {
        addResult('✅ 성공: Immer가 getValue() 결과도 완벽하게 보호합니다!');
      } else {
        addResult('❌ 예상치 못한 결과가 발생했습니다.');
      }
    }

    updateCurrentValue();
  };

  // 테스트 2: setValue로 넣은 객체를 나중에 수정해도 Store가 보호되는지 테스트
  const testSetValueProtection = () => {
    addResult('🧪 테스트 2: setValue 후 원본 객체 수정');

    // 새로운 객체 생성 (가변 객체)
    const newUser = {
      id: '2',
      name: 'Jane Smith',
      profile: {
        age: 25,
        address: {
          city: 'Busan',
          country: 'Korea',
        },
        hobbies: ['painting', 'music'],
      },
    };

    // Store에 설정
    userStore.setValue(newUser);
    addResult(`Store에 설정된 이름: ${userStore.getValue().name}`);

    try {
      // 원본 객체를 수정 시도
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
      addResult(`⚠️ Immer 보호 동작: ${error}`);
      addResult('ℹ️ 이는 Immer가 불변성을 강제로 보장하는 정상적인 동작입니다.');
      
      // Store 값이 여전히 원본과 같은지 확인
      if (userStore.getValue().name === 'Jane Smith') {
        addResult('✅ 성공: Immer가 완벽하게 불변성을 보장합니다!');
      } else {
        addResult('❌ 예상치 못한 결과가 발생했습니다.');
      }
    }

    updateCurrentValue();
  };

  // 테스트 3: update 함수에서 받은 객체를 수정해도 안전한지 테스트
  const testUpdateProtection = () => {
    addResult('🧪 테스트 3: update 함수 내 객체 수정');

    try {
      userStore.update((currentUser) => {
        addResult(`Update 함수 내 현재 이름: ${currentUser.name}`);

        let modificationSucceeded = false;
        let errorOccurred = false;
        let errorMessage = '';

        try {
          // update 함수에서 받은 객체를 직접 수정 시도
          (currentUser as any).name = 'Hacked Name';
          addResult(`1단계 수정 성공: 이름이 '${currentUser.name}'으로 변경됨`);
          modificationSucceeded = true;
        } catch (error) {
          addResult(`1단계 수정 차단: ${error}`);
          errorOccurred = true;
          errorMessage = String(error);
        }

        try {
          (currentUser as any).profile.age = 777;
          addResult(`2단계 수정 성공: 나이가 ${currentUser.profile.age}으로 변경됨`);
        } catch (error) {
          addResult(`2단계 수정 차단: ${error}`);
          errorOccurred = true;
          if (!errorMessage) errorMessage = String(error);
        }

        try {
          (currentUser as any).profile.address.city = 'Hacked City';
          addResult(`3단계 수정 성공: 도시가 '${currentUser.profile.address.city}'으로 변경됨`);
        } catch (error) {
          addResult(`3단계 수정 차단: ${error}`);
          errorOccurred = true;
          if (!errorMessage) errorMessage = String(error);
        }

        if (modificationSucceeded && !errorOccurred) {
          addResult('ℹ️ 의도된 동작: 일시적 수정 허용됨 (Immer draft 상태에서만 적용)');
          addResult('ℹ️ 실제 Store에는 return 값만 반영되므로 문제없음');
        } else if (errorOccurred) {
          addResult('⚠️ Immer Proxy가 직접 수정을 차단함 (read-only 속성)');
          addResult('ℹ️ 이는 update 함수 내에서도 Immer가 불변성을 보장하는 정상적인 동작입니다.');
          addResult('✅ 성공: Immer가 update 함수 내에서도 보호합니다!');
        }

        // 정상적인 업데이트 반환
        return {
          ...currentUser,
          name: 'Updated Name',
          profile: {
            ...currentUser.profile,
            age: 26,
          },
        };
      });

      const finalValue = userStore.getValue();
      addResult(
        `최종 Store 이름: ${finalValue.name}, 나이: ${finalValue.profile.age}`
      );

      if (finalValue.name === 'Updated Name' && finalValue.profile.age === 26) {
        addResult('✅ 추가 성공: update 함수의 반환값이 정상적으로 적용되었습니다!');
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
          country: 'Japan',
        },
        hobbies: ['swimming', 'traveling', 'photography'],
      },
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
      addResult(
        `수정 시도 후 Store 국가: ${storeValue.profile.address.country}`
      );
      addResult(
        `수정 시도 후 Store 취미: ${JSON.stringify(storeValue.profile.hobbies)}`
      );

      const isAddressProtected =
        storeValue.profile.address.city === 'Tokyo' &&
        storeValue.profile.address.country === 'Japan';
      const isHobbiesProtected =
        storeValue.profile.hobbies.length === 3 &&
        storeValue.profile.hobbies[0] === 'swimming' &&
        !storeValue.profile.hobbies.includes('hacking');

      if (isAddressProtected && isHobbiesProtected) {
        addResult('✅ 성공: 중첩 객체와 배열이 완벽하게 보호되었습니다!');
      } else {
        addResult('❌ 실패: 중첩 객체나 배열이 수정되었습니다!');
      }
    } catch (error) {
      addResult(`⚠️ Immer 보호 동작: ${error}`);
      addResult('ℹ️ 이는 Immer가 깊은 객체까지 완벽하게 보호하는 정상적인 동작입니다.');
      
      // Store 값이 여전히 원본과 같은지 확인
      const finalValue = userStore.getValue();
      const isAddressProtected =
        finalValue.profile.address.city === 'Tokyo' &&
        finalValue.profile.address.country === 'Japan';
      const isHobbiesProtected =
        finalValue.profile.hobbies.length === 3 &&
        finalValue.profile.hobbies[0] === 'swimming' &&
        !finalValue.profile.hobbies.includes('hacking');

      if (isAddressProtected && isHobbiesProtected) {
        addResult('✅ 성공: Immer가 중첩 객체와 배열을 완벽하게 보호합니다!');
      } else {
        addResult('❌ 예상치 못한 결과가 발생했습니다.');
      }
    }

    updateCurrentValue();
  };

  // 테스트 5: Immer Copy-on-Write 최적화 테스트
  const testImmerCopyOnWrite = () => {
    addResult('🧪 테스트 5: Immer Copy-on-Write 최적화');

    const testUser: User = {
      id: '4',
      name: 'Immer Test User',
      profile: {
        age: 28,
        address: {
          city: 'Incheon',
          country: 'Korea',
        },
        hobbies: ['gaming', 'cooking'],
      },
    };

    userStore.setValue(testUser);
    
    // 1. 변경 없는 경우 - 원본 참조 반환 확인
    const original = userStore.getValue();
    const unchanged = produce(original, (_draft: User) => {
      // 아무 변경도 하지 않음
    });
    
    addResult(`변경 없음: 참조가 같은가? ${original === unchanged ? '✅ 예 (최적화됨)' : '❌ 아니오'}`);
    
    // 2. 변경 있는 경우 - 새로운 객체 반환 확인
    const changed = produce(original, draft => {
      draft.name = 'Changed Name';
    });
    
    addResult(`변경 있음: 참조가 다른가? ${original !== changed ? '✅ 예 (새 객체)' : '❌ 아니오'}`);
    addResult(`원본 이름: ${original.name}, 변경된 이름: ${changed.name}`);
    
    // 3. 부분 변경 - 변경되지 않은 부분은 참조 공유
    const partialChanged = produce(original, draft => {
      draft.name = 'Partial Change';
    });
    
    const profileRefShared = original.profile === partialChanged.profile;
    const addressRefShared = original.profile.address === partialChanged.profile.address;
    const hobbiesRefShared = original.profile.hobbies === partialChanged.profile.hobbies;
    
    addResult(`부분 변경 후 profile 참조 공유: ${profileRefShared ? '✅ 예' : '❌ 아니오'}`);
    addResult(`부분 변경 후 address 참조 공유: ${addressRefShared ? '✅ 예' : '❌ 아니오'}`);
    addResult(`부분 변경 후 hobbies 참조 공유: ${hobbiesRefShared ? '✅ 예' : '❌ 아니오'}`);
    
    updateCurrentValue();
  };

  // 테스트 6: 성능 비교 테스트
  const testPerformanceComparison = () => {
    addResult('🧪 테스트 6: Immer vs JSON 성능 비교');
    
    const largeObject: User = {
      id: 'perf-test',
      name: 'Performance Test User',
      profile: {
        age: 30,
        address: {
          city: 'Seoul',
          country: 'Korea',
        },
        hobbies: new Array(1000).fill(0).map((_, i) => `hobby-${i}`),
      },
    };

    const iterations = 1000;
    
    // Immer 성능 측정
    const immerStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const _result = produce(largeObject, _draft => {
        // 변경 없음 - Copy-on-Write 최적화
      });
    }
    const immerTime = performance.now() - immerStart;
    
    // JSON 방식 성능 측정
    const jsonStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const _result = JSON.parse(JSON.stringify(largeObject));
    }
    const jsonTime = performance.now() - jsonStart;
    
    addResult(`Immer (변경 없음): ${immerTime.toFixed(2)}ms`);
    addResult(`JSON 복사: ${jsonTime.toFixed(2)}ms`);
    addResult(`성능 개선: ${((jsonTime / immerTime) - 1).toFixed(1)}x 더 빠름`);
    
    // 변경 있는 경우
    const immerChangeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const _result = produce(largeObject, draft => {
        draft.name = `Changed-${i}`;
      });
    }
    const immerChangeTime = performance.now() - immerChangeStart;
    
    addResult(`Immer (변경 있음): ${immerChangeTime.toFixed(2)}ms`);
    addResult(`변경 시 JSON 대비: ${((jsonTime / immerChangeTime) - 1).toFixed(1)}x 더 빠름`);
  };

  const runAllTests = () => {
    setTestResults([]);
    addResult('🚀 Store 불변성 테스트 시작 - Immer 기반');

    // 순차적으로 테스트 실행
    setTimeout(() => testDirectModification(), 100);
    setTimeout(() => testSetValueProtection(), 500);
    setTimeout(() => testUpdateProtection(), 900);
    setTimeout(() => testDeepObjectProtection(), 1300);
    setTimeout(() => testImmerCopyOnWrite(), 1700);
    setTimeout(() => testPerformanceComparison(), 2100);
    setTimeout(() => addResult('🏁 모든 테스트 완료'), 2500);
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
            Store 불변성(Immutability) 테스트 - Immer 기반
          </h1>
          <p className="text-gray-600 mb-2">
            Store에 객체를 넣고 수정했을 때 원본이 보호되는지 테스트합니다.
          </p>
          <p className="text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded">
            ✨ <strong>Immer Copy-on-Write 최적화</strong>: 변경사항이 없으면 원본 객체를 그대로 반환하여 성능을 최적화합니다.
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
            <Button onClick={testImmerCopyOnWrite} variant="outline">
              테스트 5: Copy-on-Write
            </Button>
            <Button onClick={testPerformanceComparison} variant="outline">
              테스트 6: 성능 비교
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
                    result.includes('✅')
                      ? 'bg-green-100 text-green-800'
                      : result.includes('❌')
                        ? 'bg-red-100 text-red-800'
                        : result.includes('🧪')
                          ? 'bg-blue-100 text-blue-800 font-semibold'
                          : result.includes('🚀') || result.includes('🏁')
                            ? 'bg-purple-100 text-purple-800 font-semibold'
                            : 'bg-gray-100 text-gray-700'
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
          <div className="space-y-4 text-sm">
            <div>
              <strong>테스트 1: 직접 수정</strong>
              <p className="text-gray-600 mb-2">
                <code>store.getValue()</code>로 받은 객체를 <code>obj.name = "Modified Name"</code>, <code>obj.profile.age = 999</code> 등으로 직접 변경 시도
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-2">
                <p className="text-green-700 text-xs">
                  <strong>✅ 예상 결과:</strong> <code>TypeError: Cannot assign to read only property</code> 발생, Store 값은 <code>"John Doe"</code> 유지
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-2 mt-1">
                <p className="text-red-700 text-xs">
                  <strong>❌ 문제 상황:</strong> 에러 없이 수정되고 Store 값도 <code>"Modified Name"</code>으로 변경됨
                </p>
              </div>
            </div>
            <div>
              <strong>테스트 2: setValue 보호</strong>
              <p className="text-gray-600 mb-2">
                <code>store.setValue(obj)</code> 실행 후 원본 <code>obj</code> 객체를 <code>obj.name = "Modified Jane"</code>으로 변경 시도
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-2">
                <p className="text-green-700 text-xs">
                  <strong>✅ 예상 결과:</strong> 원본 객체는 <code>"Modified Jane"</code>으로 변경되지만 Store 값은 <code>"Jane Smith"</code> 유지
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-2 mt-1">
                <p className="text-red-700 text-xs">
                  <strong>❌ 문제 상황:</strong> Store 값도 <code>"Modified Jane"</code>으로 변경됨 (참조 공유 문제)
                </p>
              </div>
            </div>
            <div>
              <strong>테스트 3: update 보호</strong>
              <p className="text-gray-600 mb-2">
                <code>store.update(currentValue =&gt; ...)</code> 함수 내에서 <code>currentValue.name = "Hacked Name"</code>, <code>currentValue.profile.age = 777</code> 등으로 직접 변경 시도
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-2">
                <p className="text-green-700 text-xs">
                  <strong>✅ 예상 결과:</strong> <code>TypeError: Cannot assign to read only property</code> 발생, Store는 <code>return</code> 값인 <code>"Updated Name"</code>으로만 변경됨
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-2 mt-1">
                <p className="text-red-700 text-xs">
                  <strong>❌ 문제 상황:</strong> 직접 수정이 허용되어 Store 값이 <code>"Hacked Name"</code>으로 변경됨
                </p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mt-1">
                <p className="text-blue-700 text-xs">
                  <strong>ℹ️ Immer 동작:</strong> <code>draft</code> 객체는 Proxy로 변경을 추적하거나 차단<br />
                  <strong>중요:</strong> 직접 수정이 허용되더라도 실제 Store에는 <code>return</code> 값만 반영됨
                </p>
              </div>
            </div>
            <div>
              <strong>테스트 4: 깊은 복사</strong>
              <p className="text-gray-600 mb-2">
                <code>getValue()</code>로 받은 객체를 <code>obj.profile.address.city = "Modified Tokyo"</code>, <code>obj.profile.hobbies.push("hacking")</code> 등으로 중첩 변경 시도
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-2">
                <p className="text-green-700 text-xs">
                  <strong>✅ 예상 결과:</strong> <code>TypeError</code> 발생하거나 Store 값은 <code>"Tokyo"</code>, <code>["swimming", "traveling", "photography"]</code> 유지
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-2 mt-1">
                <p className="text-red-700 text-xs">
                  <strong>❌ 문제 상황:</strong> Store 값도 <code>"Modified Tokyo"</code>, <code>["swimming", ..., "hacking"]</code>으로 변경됨
                </p>
              </div>
            </div>
            <div>
              <strong>테스트 5: Copy-on-Write 최적화</strong>
              <p className="text-gray-600 mb-2">
                변경사항 없는 <code>produce()</code> 실행과 부분 변경 시 참조 공유 여부 확인
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-2">
                <p className="text-green-700 text-xs">
                  <strong>✅ 예상 결과:</strong> 변경 없음 시 <code>original === result</code>, 부분 변경 시 미변경 부분은 참조 공유
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-2 mt-1">
                <p className="text-red-700 text-xs">
                  <strong>❌ 문제 상황:</strong> 항상 새 객체 생성하여 불필요한 메모리 사용
                </p>
              </div>
            </div>
            <div>
              <strong>테스트 6: 성능 비교</strong>
              <p className="text-gray-600 mb-2">
                1000회 반복으로 Immer Copy-on-Write vs <code>JSON.parse(JSON.stringify())</code> 방식의 실행 시간 측정
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-2">
                <p className="text-green-700 text-xs">
                  <strong>✅ 예상 결과:</strong> Immer(변경 없음)가 JSON 방식보다 현저히 빠른 성능 (수십 배 차이)
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-2 mt-1">
                <p className="text-red-700 text-xs">
                  <strong>❌ 문제 상황:</strong> Immer가 더 느리거나 비슷한 성능 (최적화 실패)
                </p>
              </div>
            </div>
          </div>
        </DemoCard>

        {/* Immer 개념 설명 */}
        <DemoCard title="🎯 Immer Copy-on-Write 개념" variant="info">
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <strong className="text-blue-800">Copy-on-Write 최적화</strong>
              <p className="text-blue-700 mt-1">
                변경사항이 없으면 원본 객체를 그대로 반환하여 불필요한 복사를 방지합니다.
                메모리 사용량과 성능이 크게 개선됩니다.
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <strong className="text-green-800">구조적 공유 (Structural Sharing)</strong>
              <p className="text-green-700 mt-1">
                객체의 일부만 변경되면, 변경되지 않은 부분은 원본과 참조를 공유합니다.
                대용량 객체에서도 효율적인 업데이트가 가능합니다.
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <strong className="text-purple-800">불변성 보장</strong>
              <p className="text-purple-700 mt-1">
                모든 변경사항은 새로운 객체를 생성하므로 원본 데이터가 절대 변경되지 않습니다.
                예측 가능하고 안전한 상태 관리가 가능합니다.
              </p>
            </div>
          </div>
        </DemoCard>
      </div>
    </PageWithLogMonitor>
  );
}

export default StoreImmutabilityTestPage;
